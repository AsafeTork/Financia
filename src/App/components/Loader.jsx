function Loader({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{background:'var(--bg-page)'}}>
      <div className="w-10 h-10 border-2 border-gray-200 rounded-full animate-spin" style={{borderTopColor:'var(--brand)'}}/>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export default Loader;