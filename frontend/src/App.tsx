import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./routes/Landing";
import Try from "./routes/Try";
import Upload from "./routes/Upload";
import Processing from "./routes/Processing";
import Dashboard from "./routes/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/try" element={<Try />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/processing" element={<Processing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
