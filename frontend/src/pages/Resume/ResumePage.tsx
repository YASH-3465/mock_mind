import { useState } from "react";
import { FileText, LoaderCircle, UploadCloud, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { analyzeResume, generateInterview, uploadResume } from "../../lib/api";

export default function ResumePage(){
 const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false); const [stage,setStage]=useState("");
 const navigate=useNavigate();
 async function start(){if(!file)return;setBusy(true);try{setStage("Uploading resume…");const resume=await uploadResume(file);setStage("Analyzing your profile…");const analysis=await analyzeResume(resume.id);setStage("Building your interview…");const interview=await generateInterview(analysis.id);localStorage.setItem("mockmind_session",String(interview.session_id));navigate(`/interview/${interview.session_id}`)}catch(err:any){toast.error(err?.response?.data?.detail??"Could not prepare the interview.")}finally{setBusy(false);setStage("")}}
 return <main className="app-shell"><nav className="nav"><button className="brand back-brand" onClick={()=>navigate("/dashboard")}><span className="brand-mark">M</span> MOCK MIND</button><span className="step-label">SETUP / 01</span></nav>
 <section className="resume-page"><div className="resume-copy"><div className="eyebrow">STEP 01 / YOUR RESUME</div><h1>Give the interviewer something real to work with.</h1><p>Upload a PDF. We’ll use your education, skills, projects, experience, strengths and gaps to build the conversation.</p><div className="resume-points"><span><CheckCircle2/> Questions reference your profile</span><span><CheckCircle2/> No generic question bank</span><span><CheckCircle2/> One continuous interview session</span></div></div>
 <div className="upload-card"><input id="resume" type="file" accept=".pdf,application/pdf" hidden onChange={e=>setFile(e.target.files?.[0]??null)}/><label htmlFor="resume" className="dropzone"><div className="upload-icon"><UploadCloud size={29}/></div><h3>{file?file.name:"Drop your resume here"}</h3><p>{file?"PDF selected":"or click to browse • PDF only"}</p></label>{file&&<div className="file-row"><FileText size={18}/><span>{file.name}</span><b>Ready</b></div>}<button className="primary-btn full" disabled={!file||busy} onClick={start}>{busy?<><LoaderCircle className="spin" size={17}/>{stage}</>:<>Build my interview <ArrowRight size={17}/></>}</button><small>Your camera and microphone are requested only when the interview begins.</small></div></section></main>
}
