import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../../lib/api";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const navigate=useNavigate();
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await login(email,password);toast.success("Welcome back.");navigate("/dashboard")}catch(err:any){toast.error(err?.response?.data?.detail??"Unable to log in.")}finally{setBusy(false)}}
  return <main className="auth-shell"><div className="auth-panel"><Link to="/" className="brand"><span className="brand-mark">M</span> MOCK MIND</Link><div className="auth-content"><div className="eyebrow">WELCOME BACK</div><h1>Enter the interview room.</h1><p>Continue your preparation journey.</p><form onSubmit={submit}><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@example.com"/></label><label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="••••••••"/></label><button className="primary-btn full" disabled={busy}>{busy?"Signing in…":"Log in"}</button></form><p className="switch">New to Mock Mind? <Link to="/signup">Create an account</Link></p></div></div><div className="auth-art"><div className="art-grid"/><div className="art-quote">“Confidence comes from rehearsal.”<small>— Mock Mind</small></div></div></main>
}
