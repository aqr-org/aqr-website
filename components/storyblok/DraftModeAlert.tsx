'use client';

export default function DraftModeAlert() {
  const disableDraftMode = () => {
    window.location.href = '/api/disable-draft';
  };

  const toggleGridLines = () => {
    document.body.classList.toggle('draftMode');
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 bg-yellow-400 text-black p-2 text-center text-sm">
      <span className="mr-2">Draft Mode Active</span>
      
      <button 
        onClick={toggleGridLines}
        className="underline hover:no-underline font-semibold cursor-pointer"
      >
        Toggle Grid
      </button>
      &nbsp;|&nbsp;
      <button 
        onClick={disableDraftMode}
        className="underline hover:no-underline font-semibold cursor-pointer"
      >
        Exit Draft Mode
      </button>
    </div>
  );
}
