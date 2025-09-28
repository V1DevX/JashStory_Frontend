import React, { useEffect, useRef, useState } from "react";
import api from '../../../api';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";

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
	// cont lang = Use Language 

	// Redactor states
	const [currLang, setCurrLang] = useState('ru')
	const [previewImageUrl, setPreviewImageUrl] = useState("")
	const [title, setTitle] = useState("")
	const [desc, setDesc] = useState("")
	const [blocks, setBlocks] = useState([])



	// useEffect(()=>{
	// 	const localSavedData = JSON.parse(localStorage.getItem("newPost"))
	// 	if (localSavedData) {
	// 		setPreviewImageUrl(localSavedData.previewImage.url)
	// 		setTitle(localSavedData[currLang].title)
	// 		setDesc(localSavedData[currLang].desc)
	// 		setBlocks(localSavedData[currLang].blocks)

	// 	} else console.log('No localSavedData');
		
	// },[])

	/// Types Tip:
	// h { id, type, content }
	// p { id, type, content }
	// img { id, public_id, type, url, desc }
	
	// Add New Block
	const [idCount, setIdCount] = useState(1)
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
				// newBlock.title = null
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
		setBlocks([...blocks, newBlock])
		setIdCount(prev => prev+1)
	}

	const uploadImage = async (file, public_id, tags=[]) => {
		if(!file) return false
		console.log(public_id)

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
	// const saveLocalStorage = (data, key="newPost") => {
	// 	if (data) { localStorage.setItem(key, JSON.stringify(data)) }
	// }

	// const updateData = (path, value) => {
	// 	const pathCopy = [...path];
	// 	const lastKey = pathCopy.pop();

	// 	const targetObj = pathCopy.reduce((current, key) => {

	// 		if (Array.isArray(current) && typeof key === 'number') {
	// 			// Check if the index exists, if not, create an empty object or array as needed
	// 			if (!current[key]) {
	// 				current[key] = {};
	// 			}
	// 			return current[key];
	// 		}

	// 		// If the key doesn't exist or is not an object, create a new object
	// 		if (typeof current[key] !== 'object' || current[key] === null) {
	// 			current[key] = {};
	// 		}

	// 		return current[key];
	// 	}, formDataRef.current);
		
	// 	// Set the value on the target object
	// 	targetObj[lastKey] = value;
		
	// 	// saveLocalStorage(formDataRef.current)
	// }

	/// Update Data in old/new languages
	const updateAllData = (lang=currLang) => {
		formDataRef.current[currLang].title = title
		formDataRef.current[currLang].desc = desc
		formDataRef.current[currLang].blocks = blocks

		setTitle(formDataRef.current[lang].title)
		setDesc(formDataRef.current[lang].desc)
		setBlocks(syncBlocks(formDataRef.current[lang].blocks, blocks))

		// saveLocalStorage({...formDataRef.current, idCount})
		setCurrLang(lang)
	}

	// Upload Block
	const updateBlock = async (id, e) => {
		const newBlocks = []
		for (let block of blocks){
			if (block.id !== id) {newBlocks.push(block); continue}

			// TODO: Оптимизация - V1
			switch (e.target.name) {
					// H, P, Div
				// case "content": 
				// case "desc":
				// case "side":
				// case "shape":
				// 	const newBlock = {...block, [e.target.name]:e.target.value };
				// 	newBlocks.push(newBlock)
				// 	continue

				// 	// Img, Div
				// case "desc":
				// 	const newBlockDesc = {...block, desc:e.target.value };
				// 	newBlocks.push(newBlockDesc)
				// 	continue
				
				// 	// Div 
				// case "side":
				// 	const newBlockSide = {...block, side: e.target.value}
				// 	newBlocks.push(newBlockSide)
				// 	continue
				// case "shape":
				// 	const newBlockShape = {...block, shape: e.target.value}
				// 	newBlocks.push(newBlockShape)
				// 	continue

					// Img, Div
				case "file": 
					const file = e.target.files[0]
					if (!file){ newBlocks.push(block); continue } // No image

					const imageData = await uploadImage(file, block.public_id, ['block_image'])
					const newBlockImage = {...block, ...imageData};

					newBlocks.push(newBlockImage)
					continue

				default:
					const newBlock = {...block, [e.target.name]:e.target.value };
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


	///		Buttons
	const DeleteButton = (id) =>
		<button 
			className="absolute right-0 top-0 bg-[#bb0000] hover:bg-[#ff0000] text-white px-[20px] py-[5px] rounded-[10px]"
			onClick={()=>deleteBlock(id)}>X</button>
	

	///		Blocks

	const HeadingBlock = (block) =>
		<div className="relative m-2"
			key={block.id}>
			<input className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
					duration-300 outline-none w-[100%] p-4 bg-gray-900 text-3xl font-[800] md:text-[32px]"
					type="text" placeholder="Heading"
					name="content" value={block.content} 
					onChange={(e)=>updateBlock(block.id, e)}/>
			{DeleteButton(block.id)}
		</div>

	const ParagraphBlock = (block) =>
		<div className="relative m-2"
			key={block.id}>
			<textarea className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
					duration-300 outline-none w-[100%] p-4 bg-gray-900 font-[600] md:text-[16px]"
					type="text" 		placeholder="Paragraph"
					name="content" 	value={block.content}
					onChange={(e)=>updateBlock(block.id, e)}/>
			{DeleteButton(block.id)}
		</div>

	const ImageBlock = (block) => <div className="relative flex flex-col justify-center gap-3"
			key={block.id}>
			<input className="hidden" 
				type="file" id={block.id} name="file" accept="image/*"
				onChange={(e)=>updateBlock(block.id, e)}/>

			<div className="flex flex-col items-center gap-3">
				<label className='cursor-pointer' htmlFor={block.id}>
					{block.url ? <img className="h-[300px]" src={block.url} alt={block.desc} /> : 
					<b className="flex justify-center items-center h-[250px] w-[400px] bg-gray-900 text-[32px]">+</b>}
				</label>
					{/* Delete Button */}
					{block.url ? 
						<button 
						className="bg-[#bb0000] hover:bg-[#ff0000] text-white px-[20px] py-[5px] rounded-[10px]"
						onClick={(e)=>{
							// deleteImage(block.public_id)
							updateBlock(block.id, {target: {name: 'url', value: ''}})
							updateBlock(block.id, {target: {name: 'public_id', value: ''}})
						}}>Delete image</button> : ""
					}
				<input className="w-[500px] border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
					duration-200 outline-none p-2 bg-gray-900 font-[600] md:text-[14px]"
					type="text" placeholder="Description"
					name="desc" value={block.desc}
					onChange={(e)=>{console.log(block.id, e);
						updateBlock(block.id, e)}}/>
			</div>

			{DeleteButton(block.id)}
	</div>

	const DivBlock = (block) => <div className="relative m-2"
			key={block.id}>
			{/* PARAGRAPH */}
			<div className={`flex ${block.side==='left' ?'flex-row-reverse' : 'flex-row'}`}>
				<textarea className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
						basis-2/3 duration-200 outline-none p-4 bg-gray-900 font-[600] md:text-[16px]
						overflow-y-auto min-h-[300px]
						[&::-webkit-scrollbar]:w-1
						[&::-webkit-scrollbar-track]:rounded-full
						[&::-webkit-scrollbar-track]:bg-purple-950/20
						[&::-webkit-scrollbar-thumb]:rounded-full
						[&::-webkit-scrollbar-thumb]:bg-purple-800"

						type="text" 		placeholder="Paragraph"
						name="content" 	value={block.content}
						onChange={(e)=>updateBlock(block.id, e)}/>
				
				<div className="basis-1/3 flex flex-col items-center m-2 px-4 gap-3">
					<input className="hidden" 
						type="file" id={block.id} name="file" accept="image/*"
						onChange={(e)=>updateBlock(block.id, e)}/>
					
					<label className='cursor-pointer h-[200px] flex justify-center' htmlFor={block.id}>
						{block.url ? <img className={block.shape==="circle" ? 'rounded-[100px]' : ''} src={block.url} alt={block.desc} /> : 
						<b className={`flex justify-center items-center w-[200px] bg-gray-900 text-[32px] 
						${block.shape==="circle" ? 'rounded-[100px]' : ''}`}>+</b>}
					</label>

					<input className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
						duration-200 outline-none p-2 bg-gray-900 font-[600] md:text-[14px]"
						type="text" placeholder="Description"
						name="desc" value={block.desc}
						onChange={(e)=>{console.log(block.id, e);
						 updateBlock(block.id, e)}}/>
					<label>
						Image shape:
						<select className="bg-gray-900" 
							name="shape"onChange={(e)=>updateBlock(block.id, e)}>
							<option value="square">Square</option>
							<option value="circle">Circle</option>
						</select>
					</label>
					<label>
						Image side:
						<select className="bg-gray-900" 
							name="side"onChange={(e)=>updateBlock(block.id, e)}>
							<option value="right">Right</option>
							<option value="left">Left</option>
						</select>
					</label>
				</div>
			</div>

			{DeleteButton(block.id)}
	</div>


	/// Syncronize all languages blocks
	const syncBlocks = (oldBlocks, newBlocks) => {
		// Цель: Не добавлять блоки которых нет
		//       Если есть блок, копирует данные кроме переводимого текста
		// TODO: Оптимизировать, ужасный код. (правило DRY) - V1

		// Создаем словарь {id: content} из старых блоков
		const oldMap = oldBlocks.reduce((map, block) => {
			switch (block.type){
				case 'img': map[block.id] = {
					desc: block.desc,
				}; break

				case 'div': map[block.id] = {
					desc: block.desc, 
					content: block.content,
				}; break

				case 'h': case 'p': map[block.id] = {
					content: block.content,
				}; break

				default: map[block.id] = {Error: true}
			}
			return map;
		}, {});
		// Обновляем новые блоки
		return newBlocks.map(block => { 
			switch (block.type){
				case "img": return {...block, 
					desc: oldMap[block.id]?.desc || ""
				}
				case "div": return {...block, 
					desc: oldMap[block.id]?.desc || "", 
					content: oldMap[block.id]?.content || ""
				}
				default: return {...block, 
					content: oldMap[block.id]?.content || ""
				}
		}})
	}
	
	

	

	/// Upload Post
	const uploadPost = async () => {
		updateAllData()
		
		// Validation 
		// api.get('/auth/current-user').then(res => console.log(res.data.data))

		// Upload Preview Image
		

		// Синхронизация
		for (const lang of ['en', 'ru', 'kg']) {
			formDataRef.current[lang].blocks = syncBlocks(formDataRef.current[lang].blocks, formDataRef.current[currLang].blocks)
		}


		api.post('/posts/', {
			ru: formDataRef.current.ru,
			en: formDataRef.current.en,
			kg: formDataRef.current.kg,
			previewImage: JSON.stringify(formDataRef.current.previewImage)
		}).then(res => console.log(res))
		.catch(err => console.error(err.message))
	}


	return (
		<>
			<header className="flex justify-between items-center">
				<h1 className="text-[30px] font-[700]">Create Post</h1>

				{/* PREVIEW IMAGE */}
				<div className="flex my-[20px] gap-5 justify-center items-center">
					{/* Image */}
					{previewImageUrl ? previewImageUrl==='loading' ? <span>Loading image...</span>:
						<img className="h-[70px]"
							src={previewImageUrl} alt="preview image" /> : ''
					}

					{/* PREVIEW IMAGE Control */}
					<div className="flex flex-col gap-[10px]">
						{/* Hidden Image Input */}
						<input className="hidden"
							type="file" accept="image/*" id="previewImage" 
							onChange={async (e)=>{
								
								const file = e.target.files[0]
								if (!file) return
								
								setPreviewImageUrl('loading')
								try {
									const public_id = formDataRef.current.previewImage?.public_id
									const previewImageData = await uploadImage(file, public_id, ['preview_image'])

									formDataRef.current.previewImage = previewImageData
									setPreviewImageUrl(previewImageData.url)
								} catch (e) {
									console.log(e);
									setPreviewImageUrl('')
								}

							}}/>
						{/* Input Button */}
						<label className="bg-[#ffff00] text-black px-[20px] py-[5px] rounded-[10px] cursor-pointer"
							htmlFor="previewImage">
								{previewImageUrl ? "Change preview image" : "Choose preview image"}
						</label>

						{/* Delete Button */}
						{previewImageUrl ? 
							<button 
							className="bg-[#bb0000] hover:bg-[#ff0000] text-white px-[20px] py-[5px] rounded-[10px]"
							onClick={()=>{
								deleteImage(formDataRef.current.previewImage.public_id)
								setPreviewImageUrl("")
								formDataRef.current.previewImage.file = null
							}}>Delete</button> : ""
						}
					</div>
				</div>
				{/* <button onClick={() => navigate(-1)} 
					className="duration-300 text-[20px] p-2  rounded-[5px] 
					text-[#cc0000] text-[30px] font-[1000] hover:text-[#ff0000]
					drop-shadow-[0_0px_10px_rgba(255,0,0,0.3)] hover:drop-shadow-[0_0px_10px_rgba(255, 0,0,0.6)]">X</button> */}
			</header>

			{/* LANGUAGE */}
			<div className="mb-[10px] grid grid-cols-3">
				{["ru", "en", "kg"].map(lang => (
					<button
						key={lang}
						onClick={() => updateAllData(lang)}
						className={`px-[15%] text-[20px] font-[600] duration-200 ${
							currLang === lang ? 'bg-violet-800' : 'bg-gray-900 hover:bg-violet-950'
						}`}
					>
						{lang.toUpperCase()}
					</button>
				))}
			</div>
			
			<div 
				className="mt-2 h-[calc(100vh-220px)] overflow-y-auto flex flex-col gap-2
				[&::-webkit-scrollbar]:w-1
				[&::-webkit-scrollbar-track]:rounded-full
				[&::-webkit-scrollbar-track]:bg-purple-950/20
				[&::-webkit-scrollbar-thumb]:rounded-full
				[&::-webkit-scrollbar-thumb]:bg-purple-800">

				
				{/* TITLE */}
				<div className="m-1">

				<input className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800
					duration-300 outline-none w-[100%] p-4 bg-gray-900 text-5xl md:text-[64px] font-unbounded font-bold"
					name="title" type="text"
					placeholder="Title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}/>

				{/* DESCRIPTION */}
				<input className="border-indigo border-b-4 border-b-gray-800 focus:border-b-purple-800 
					duration-200 outline-none w-[100%] p-2 mt-2 bg-gray-900 text-3xl md:text-[16px] font-unbounded font-bold"
					name="desc" type="text"
					placeholder="Description"
					value={desc}
					onChange={(e) => setDesc(e.target.value)}/>
				</div>


				{/* BLOCKS */}
				<div className="w-[100%] flex flex-col gap-[20px]">
					{blocks.map(block => {
						switch (block.type) {
							case "h": return HeadingBlock(block)
							case "p": return ParagraphBlock(block)
							case "img": return ImageBlock(block)
							case "div": return DivBlock(block)

							default:
								return <p className="text-[red] bg-[black]">UNDEFINED BLOCK</p>;
						}
					})}
				</div>
			{/* Add Buttons */}
			<div className="flex gap-[20px]">
				{['h', 'p', 'img', 'div'].map(type => 
					<button key={type} onClick={()=>addBlock(type)}>[+] {type}</button>)}
			</div>
		</div>
		<button onClick={()=>uploadPost()} 
			className="absolute right-[50px] bottom-[20px] duration-300 text-[20px] p-1 rounded-[5px] 
				bg-[#00cc00] hover:bg-[#00dd00]
				drop-shadow-[0_0px_10px_rgba(0,255,0,0.3)] hover:drop-shadow-[0_0px_10px_rgba(0,255,0,0.6)]"
				>Upload</button>
		</>
	)
}
export default PostCreate;