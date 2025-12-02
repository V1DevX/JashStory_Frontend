const cloudinaryTransforms = (url: string, transformList: string[] = []) => {
  if (!url) return url;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const before = url.slice(0, uploadIndex + 8); // '/upload/'
  const after = url.slice(uploadIndex + 8);

  const cleaned = transformList
    // .filter(t => t && t.trim().length > 0)
    // .map(t => t.replace(/^\/+|\/+$/g, ""));
  cleaned.push("f_auto", "q_auto");

  const transforms = transformList.join(",");

  return `${before}${transforms}/${after}`;
}

export default cloudinaryTransforms;