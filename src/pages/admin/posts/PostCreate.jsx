import React, { useEffect, useRef, useState } from "react";
import api from '@/api';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import useDraftStore from "@/stores/draftStore";
import * as Dialog from '@radix-ui/react-dialog';
import { List, Save, Trash2, Plus } from "lucide-react";

/*
  Изменённый PostCreate:
  - автосохранение черновика в zustand (localStorage)
  - простая панель Drafts (Radix Dialog) для просмотра/загрузки/удаления
  - небольшие UI-изменения (Tailwind + иконки) — минималистичный современный вид
*/

const PostCreate = () => {
  const formDataRef = useRef(
    JSON.parse(localStorage.getItem('newPost'))
    || {
      previewImageUrl: {public_id: "", url: ""},
      ru: {title: "", desc: "", blocks: []},
      en: {title: "", desc: "", blocks: []},
      kg: {title: "", desc: "", blocks: []},
    }
  )

  const { user } = useAuth();

  // Redactor states
  const [currLang, setCurrLang] = useState('ru')
  const [previewImageUrl, setPreviewImageUrl] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [blocks, setBlocks] = useState([])
  const [idCount, setIdCount] = useState(1)

  // Draft store
  const setDraft = useDraftStore(state => state.setDraft)
  const updateDraft = useDraftStore(state => state.updateDraft)
  const deleteDraft = useDraftStore(state => state.deleteDraft)
  const listDrafts = useDraftStore(state => state.listDrafts)

  // draft id для текущей сессии (если передан ?draft=ID - используем его)
  const [searchParams] = useSearchParams()
  const draftIdRef = useRef(searchParams.get('draft') || `draft-${Date.now()}`)

  // UI: Radix dialog open
  const [openDrafts, setOpenDrafts] = useState(false)

  // --- Подгрузка черновика при монтировании ---
  useEffect(() => {
    const id = draftIdRef.current
    const stored = useDraftStore.getState().drafts[id]
    if (stored && stored.formData) {
      formDataRef.current = stored.formData
      setCurrLang(stored.currLang || 'ru')
      setPreviewImageUrl(formDataRef.current.previewImage?.url || "")
      const lang = stored.currLang || 'ru'
      setTitle(formDataRef.current[lang]?.title || "")
      setDesc(formDataRef.current[lang]?.desc || "")
      setBlocks(formDataRef.current[lang]?.blocks || [])
      setIdCount(formDataRef.current.idCount || 1)
    } else {
      // создаём начальный черновик
      setDraft(id, { createdAt: Date.now(), updatedAt: Date.now(), currLang: currLang, formData: formDataRef.current, idCount })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Автосохранение (debounce) ---
  useEffect(() => {
    const id = draftIdRef.current
    // обновляем formDataRef перед сохранением
    formDataRef.current[currLang] = { title, desc, blocks }
    formDataRef.current.previewImage = formDataRef.current.previewImage || {}
    formDataRef.current.idCount = idCount

    const t = setTimeout(() => {
      updateDraft(id, { updatedAt: Date.now(), currLang, formData: formDataRef.current })
    }, 800)

    return () => clearTimeout(t)
  }, [title, desc, blocks, previewImageUrl, currLang, idCount, updateDraft])

  // --- Функции для работы с черновиками в UI ---
  const loadDraft = (id) => {
    const stored = useDraftStore.getState().drafts[id]
    if (!stored || !stored.formData) return
    formDataRef.current = stored.formData
    const lang = stored.currLang || 'ru'
    setCurrLang(lang)
    setPreviewImageUrl(formDataRef.current.previewImage?.url || "")
    setTitle(formDataRef.current[lang]?.title || "")
    setDesc(formDataRef.current[lang]?.desc || "")
    setBlocks(formDataRef.current[lang]?.blocks || [])
    setIdCount(formDataRef.current.idCount || 1)
    draftIdRef.current = id
    setOpenDrafts(false)
  }

  const removeDraft = (id) => {
    deleteDraft(id)
  }

  // --- Остальная логика (uploadImage, deleteImage, addBlock, updateBlock, deleteBlock, syncBlocks, uploadPost)
  // Для краткости вставляем существующую логику без изменений — она остаётся такой же, только UI улучшено выше.
  const addBlock = (type) => {
    const newBlock = { id: idCount, type }

    switch (type) {
      case "h":
      case "p":
        newBlock.content = ''
        break;

      case 'img':
        newBlock.public_id = ''
        newBlock.url = ''
        newBlock.desc = ''
        break

      case 'div':
        newBlock.content = ''
        newBlock.url = ''
        newBlock.public_id = ''
        newBlock.desc = ''
        newBlock.side = 'right'
        newBlock.shape = 'square'
        break

      default:
        console.error("❌ ERROR: Undefined type");
        break;
    }
    setBlocks(prev => [...prev, newBlock])
    setIdCount(prev => prev+1)
  }

  const uploadImage = async (file, public_id, tags=[]) => {
    if(!file) return false

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", tags);
    if (public_id && public_id!=="") formData.append("public_id", public_id.split('/')[1]);

    const res = await api.post('/media/upload', formData);
    return res.data;
  }

  const deleteImage = async (public_id) => {
    if(!public_id) return false
    const res = await api.delete('/media/delete-file', { params: { public_id } });
    return res.data;
  }

  const updateAllData = (lang=currLang) => {
    formDataRef.current[currLang].title = title
    formDataRef.current[currLang].desc = desc
    formDataRef.current[currLang].blocks = blocks

    setTitle(formDataRef.current[lang].title)
    setDesc(formDataRef.current[lang].desc)
    setBlocks(syncBlocks(formDataRef.current[lang].blocks, blocks))

    setCurrLang(lang)
  }

  const updateBlock = async (id, e) => {
    const newBlocks = []
    for (let block of blocks){
      if (block.id !== id) {newBlocks.push(block); continue}

      switch (e.target?.name) {
        case "file":
          const file = e.target.files[0]
          if (!file){ newBlocks.push(block); continue }
          const imageData = await uploadImage(file, block.public_id, ['block_image'])
          const newBlockImage = {...block, ...imageData};
          newBlocks.push(newBlockImage)
          continue

        default:
          const newBlock = {...block, [e.target?.name]:e.target?.value };
          newBlocks.push(newBlock)
      }
    }
    setBlocks(newBlocks)
  }

  const deleteBlock = (id) => {
    const newBlocks = blocks.filter(block => {
      if(block.id === id){
        if((block.type === 'img' || block.type === 'div') && block.public_id){
          deleteImage(block.public_id)
        }return false
      } else return true
    })

    setBlocks(newBlocks)
  }

  const DeleteButton = (id) =>
    <button 
      className="absolute right-0 top-0 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded"
      onClick={()=>deleteBlock(id)}>X</button>

  const HeadingBlock = (block) =>
    <div className="relative m-2" key={block.id}>
      <input className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent text-2xl font-semibold"
        type="text" placeholder="Heading"
        name="content" value={block.content} 
        onChange={(e)=>updateBlock(block.id, e)}/>
      {DeleteButton(block.id)}
    </div>

  const ParagraphBlock = (block) =>
    <div className="relative m-2" key={block.id}>
      <textarea className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent"
        placeholder="Paragraph"
        name="content" value={block.content}
        onChange={(e)=>updateBlock(block.id, e)}/>
      {DeleteButton(block.id)}
    </div>

  const ImageBlock = (block) => <div className="relative flex flex-col justify-center gap-3" key={block.id}>
    <input className="hidden" type="file" id={`file-${block.id}`} name="file" accept="image/*" onChange={(e)=>updateBlock(block.id, e)}/>
    <div className="flex flex-col items-center gap-3">
      <label className='cursor-pointer' htmlFor={`file-${block.id}`}>
        {block.url ? <img className="h-64" src={block.url} alt={block.desc} /> : 
        <div className="h-56 w-96 bg-gray-800 flex items-center justify-center text-4xl">+</div>}
      </label>
      {block.url ? 
        <button className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded" onClick={()=>{
            updateBlock(block.id, {target: {name: 'url', value: ''}})
            updateBlock(block.id, {target: {name: 'public_id', value: ''}})
        }}>Delete image</button> : null}
      <input className="w-full max-w-xl border-b border-gray-700 p-2 bg-transparent" type="text" placeholder="Description" name="desc" value={block.desc} onChange={(e)=>updateBlock(block.id, e)}/>
    </div>
    {DeleteButton(block.id)}
  </div>

  const DivBlock = (block) => <div className="relative m-2" key={block.id}>
    <div className={`flex ${block.side==='left' ?'flex-row-reverse' : 'flex-row'}`}>
      <textarea className="basis-2/3 p-4 bg-transparent border-b border-gray-700 min-h-[200px]" placeholder="Paragraph" name="content" value={block.content} onChange={(e)=>updateBlock(block.id, e)}/>
      <div className="basis-1/3 flex flex-col items-center gap-3 p-3">
        <input className="hidden" type="file" id={`file-div-${block.id}`} name="file" accept="image/*" onChange={(e)=>updateBlock(block.id, e)}/>
        <label className='cursor-pointer h-48 flex items-center justify-center' htmlFor={`file-div-${block.id}`}>
          {block.url ? <img className={block.shape==="circle" ? 'rounded-full' : ''} src={block.url} alt={block.desc} /> : <div className={`h-48 w-48 bg-gray-800 flex items-center justify-center text-2xl ${block.shape==="circle" ? 'rounded-full' : ''}`}>+</div>}
        </label>
        <input className="w-full border-b border-gray-700 p-2 bg-transparent" type="text" placeholder="Description" name="desc" value={block.desc} onChange={(e)=>updateBlock(block.id, e)}/>
        <label className="flex gap-2 items-center">
          <span className="text-sm">Shape</span>
          <select className="bg-transparent" name="shape" onChange={(e)=>updateBlock(block.id, e)}>
            <option value="square">Square</option>
            <option value="circle">Circle</option>
          </select>
        </label>
        <label className="flex gap-2 items-center">
          <span className="text-sm">Side</span>
          <select className="bg-transparent" name="side" onChange={(e)=>updateBlock(block.id, e)}>
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </label>
      </div>
    </div>
    {DeleteButton(block.id)}
  </div>

  const syncBlocks = (oldBlocks, newBlocks) => {
    const oldMap = oldBlocks.reduce((map, block) => {
      switch (block.type){
        case 'img': map[block.id] = { desc: block.desc }; break
        case 'div': map[block.id] = { desc: block.desc, content: block.content }; break
        case 'h': case 'p': map[block.id] = { content: block.content }; break
        default: map[block.id] = {Error: true}
      }
      return map;
    }, {});
    return newBlocks.map(block => { 
      switch (block.type){
        case "img": return {...block, desc: oldMap[block.id]?.desc || ""}
        case "div": return {...block, desc: oldMap[block.id]?.desc || "", content: oldMap[block.id]?.content || ""}
        default: return {...block, content: oldMap[block.id]?.content || ""}
      }
    })
  }

  const uploadPost = async () => {
    updateAllData()
    for (const lang of ['en', 'ru', 'kg']) {
      formDataRef.current[lang].blocks = syncBlocks(formDataRef.current[lang].blocks, formDataRef.current[currLang].blocks)
    }
    api.post('/posts/', {
      ru: formDataRef.current.ru,
      en: formDataRef.current.en,
      kg: formDataRef.current.kg,
      previewImage: formDataRef.current.previewImage
    }).then(res => console.log(res)).catch(err => console.error(err.message))
  }

  // --- UI render ---
  return (
    <>
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create Post</h1>

        <div className="flex items-center gap-3">
          <Dialog.Root open={openDrafts} onOpenChange={setOpenDrafts}>
            <Dialog.Trigger className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700">
              <List size={16}/>
              <span className="text-sm">Drafts</span>
            </Dialog.Trigger>
            <Dialog.Content className="fixed right-6 top-16 w-96 bg-[#0b0b0b] border border-gray-800 p-4 rounded shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Drafts</h3>
                <button className="text-sm text-violet-400" onClick={()=>{ setDraft(draftIdRef.current, { createdAt: Date.now(), currLang, formData: formDataRef.current }) }}>
                  <Save size={14}/> Save
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {listDrafts().length === 0 ? <div className="text-sm text-gray-500">No drafts</div> :
                  listDrafts().map(d => (
                    <div key={d.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                      <div>
                        <div className="text-sm font-medium">{d.formData?.[d.currLang || 'ru']?.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-500">{new Date(d.updatedAt || d.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-violet-600 rounded text-sm" onClick={()=>loadDraft(d.id)}>Open</button>
                        <button className="px-2 py-1 bg-red-700 rounded text-sm" onClick={()=>removeDraft(d.id)}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </Dialog.Content>
          </Dialog.Root>

          <button className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded hover:bg-green-500" onClick={()=>uploadPost()}>
            <Save size={14}/> Upload
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {["ru", "en", "kg"].map(lang => (
          <button
            key={lang}
            onClick={() => updateAllData(lang)}
            className={`py-2 rounded ${currLang === lang ? 'bg-violet-700' : 'bg-gray-900 hover:bg-gray-800'}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <input className="w-full p-4 bg-transparent border-b border-gray-700 text-4xl font-bold" name="title" type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/>
          <input className="w-full p-2 bg-transparent border-b border-gray-700 mt-2 text-xl" name="desc" type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)}/>
        </div>

        <div className="space-y-4">
          {blocks.map(block => {
            switch (block.type) {
              case "h": return HeadingBlock(block)
              case "p": return ParagraphBlock(block)
              case "img": return ImageBlock(block)
              case "div": return DivBlock(block)
              default:
                return <p className="text-red-500">UNDEFINED BLOCK</p>;
            }
          })}
        </div>

        <div className="flex gap-2 mt-4">
          {['h', 'p', 'img', 'div'].map(type => 
            <button key={type} onClick={()=>addBlock(type)} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700">
              <Plus size={14}/> Add {type.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
export default PostCreate;