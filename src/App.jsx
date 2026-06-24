import { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null); // Trạng thái lưu ảnh có khung vuông YOLO
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Hiển thị ảnh gốc tạm thời khi người dùng mới tải lên
      setImage(URL.createObjectURL(file));
      setAnnotatedImage(null); // Xóa ảnh có khung cũ đi
      setResult(null); 
      setIsAnalyzing(true);
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("https://ecovision-api-ki25.onrender.com/api/phan-loai", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data); 
          // 🛑 NHẬN ẢNH ĐÃ VẼ KHUNG VUÔNG TỪ PYTHON
          if (data.annotated_image) {
            setAnnotatedImage(data.annotated_image);
          }
        } else {
          setResult({
            type: "Lỗi kết nối",
            action: "Mô hình YOLO gặp sự cố xử lý.",
            confidence: "0%"
          });
        }
      } catch (error) {
        console.error("Lỗi:", error);
        setResult({
          type: "Lỗi hệ thống",
          action: "Vui lòng kiểm tra xem bạn đã bật Server FastAPI chưa nhé!",
          confidence: "0%"
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🌱 EcoVision AI v2.0</h1>
        <p>Hệ thống Nhận diện & Định vị Rác thải bằng YOLOv8</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-button">
            📸 Chụp ảnh hoặc Tải ảnh rác lên
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden-input"
          />
        </div>

        {/* KHU VỰC HIỂN THỊ ẢNH */}
        {image && (
          <div className="preview-section">
            {/* Nếu có ảnh đã vẽ khung vuông YOLO thì ưu tiên hiện ảnh đó, không thì hiện ảnh gốc */}
            <img 
              src={annotatedImage ? annotatedImage : image} 
              alt="Kết quả phân tích" 
              className="uploaded-image" 
            />
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-state">
            <div className="spinner"></div>
            <p>Mô hình YOLOv8 đang quét tọa độ vật thể...</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="result-card">
            <h2>Kết quả: <span className="highlight-green">{result.type}</span></h2>
            <p className="action-text">{result.action}</p>
            <p className="confidence">Độ tự tin của YOLO: {result.confidence}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;