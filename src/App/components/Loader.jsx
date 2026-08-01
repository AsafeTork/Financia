function Loader({ text }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite"
      className="min-h-screen flex items-center justify-center flex-col gap-4"
      style={{ background: 'var(--bg-page)' }}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--brand)', borderRightColor: 'var(--brand)' }} />
      </div>
      {text && (
        <p className="text-sm anim-fade" style={{ color: 'var(--text-sub)' }}>
          {text}
        </p>
      )}
      <span className="sr-only">Carregando</span>
    </div>
  );
}

export default Loader;
