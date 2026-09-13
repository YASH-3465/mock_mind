import { ArrowRight, FileText, LogOut, Mic2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../lib/api";

export default function DashboardPage(){
 const navigate=useNavigate();
 return <main className="app-shell"><nav className="nav"><Link to="/dashboard" className="brand"><span className="brand-mark">M</span> MOCK MIND</Link><button className="ghost-btn" onClick={()=>{logout();navigate("/")}}><LogOut size={16}/> Log out</button></nav>
 <section className="dashboard"><div className="dashboard-head"><div><div className="eyebrow">YOUR INTERVIEW ROOM</div><h1>Ready when you are.</h1><p>One resume. One adaptive interview. One honest performance report.</p></div></div>
 <div className="start-card"><div className="start-icon"><FileText size={28}/></div><div><h2>Start a new interview</h2><p>Upload your latest PDF resume. Mock Mind will analyze it and generate a tailored question set.</p><div className="checks"><span><ShieldCheck size={15}/> Resume-driven questions</span><span><Mic2 size={15}/> Voice-first interaction</span></div></div><Link to="/resume" className="primary-btn">Upload resume <ArrowRight size={17}/></Link></div>
 <div className="flow"><div><b>01</b><span>Upload</span><small>PDF resume</small></div><div><b>02</b><span>Analyze</span><small>Skills & projects</small></div><div><b>03</b><span>Interview</span><small>Speak naturally</small></div><div><b>04</b><span>Review</span><small>Scores & feedback</small></div></div>
 </section></main>
}
