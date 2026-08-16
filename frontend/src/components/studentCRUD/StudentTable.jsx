import { TbTrashXFilled, TbEdit } from "react-icons/tb";

export function StudentTable({
  students,
  loading,
  openEditForm,
  setDeleteId,
}) {
  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_black] w-full overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="border-b-2 border-black bg-gray-200">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-center">Subjects</th>
            <th className="p-2">Images</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="p-2">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-32"></div>
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-40 mx-auto"></div>
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-24"></div>
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-24 mx-auto"></div>
                  </td>
                </tr>
              ))
            : students.map((s) => (
                <tr key={s.id} className="border-b">
                  {/* Name */}
                  <td className="p-2 font-bold">{s.name}</td>

                  {/* Subjects */}
                  <td className="p-2 text-center">
                    {s.subjects?.length > 0
                      ? s.subjects.map((sub) => sub.name).join(", ")
                      : "-"}
                  </td>

                  {/* Images */}
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      {(s.images || []).slice(0, 3).map((img, i) => (
                        <img
                          key={i}
                          src={img.image_url || img}
                          className="w-8 h-8 sm:w-10 sm:h-10 border object-cover"
                          alt="student"
                        />
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                      <button
                        onClick={() => openEditForm(s)}
                        className="px-2 border border-black text-xs sm:text-sm text-teal-600 flex items-center gap-1"
                      >
                        <TbEdit /> EDIT
                      </button>

                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="px-2 border border-black text-xs sm:text-sm text-red-600 flex items-center gap-1"
                      >
                        <TbTrashXFilled /> DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}