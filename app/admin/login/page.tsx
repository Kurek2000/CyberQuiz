"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (res.ok) router.push("/admin")
    else setError("Nieprawidłowy kod")
  }

  return (
    <main style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center"}}>
      <div>
        <h2>Panel admina</h2>
        <input type="password" value={code} onChange={e=>setCode(e.target.value)} />
        <button onClick={submit}>Zaloguj</button>
        {error && <p>{error}</p>}
      </div>
    </main>
  )
}
