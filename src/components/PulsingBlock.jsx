const PulsingBlock = ({w='full', h='full', className=''}) => {
  if (w!=='full' && typeof w === 'string') w = `[${w}]`;
  if (h!=='full' && typeof h === 'string') h = `[${h}]`;
  const newClassName = `w-${w} h-${h} bg-gray-300 rounded animate-pulse ${className}`
  return <div className={newClassName}></div>
}

export default PulsingBlock;