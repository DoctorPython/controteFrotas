import { createRoot } from "react-dom/client";
import App from "./App";
// #region agent log
fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:3',message:'CSS import statement',data:{imported:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import "./index.css";
// #region agent log
fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:5',message:'After CSS import',data:{cssLoaded:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:9',message:'Before render',data:{rootExists:!!document.getElementById("root")},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
createRoot(document.getElementById("root")!).render(<App />);
// #region agent log
fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:11',message:'After render',data:{rendered:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
