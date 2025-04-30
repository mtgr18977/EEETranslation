"use client"

import Logo from "@/components/logo"

export default function LogoDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Translation Platform Logo</h1>

        <div className="flex justify-center mb-8">
          <Logo width={300} height={90} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4 text-slate-700">Small</h2>
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
              <Logo width={100} height={30} />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4 text-slate-700">Medium</h2>
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
              <Logo width={200} height={60} />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4 text-slate-700">Large</h2>
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
              <Logo width={300} height={90} />
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-800 rounded-lg flex justify-center">
          <Logo width={200} height={60} className="opacity-90" />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>O logotipo representa a comunicação entre idiomas com balões de texto conectados.</p>
          <p>As cores combinam com a identidade visual da plataforma de tradução.</p>
        </div>
      </div>
    </div>
  )
}
