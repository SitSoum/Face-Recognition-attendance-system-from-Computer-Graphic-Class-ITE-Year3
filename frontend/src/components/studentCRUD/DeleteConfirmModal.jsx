// ==================
export function DeleteConfirmModal({ handleDelete, cancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_black] w-80">
        <h2 className="font-black text-lg mb-4">Confirm Delete</h2>
        <p className="text-sm mb-6">Are you sure you want to delete this student?</p>
        <div className="flex justify-end gap-3">
          <button onClick={cancel} className="px-3 py-1 border-2 border-black font-bold bg-white">
            CANCEL
          </button>
          <button onClick={handleDelete} className="px-3 py-1 border-2 border-black font-bold bg-red-500 text-white">
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}