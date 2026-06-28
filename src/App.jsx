import { useState } from 'react';
import './App.css'; // Đảm bảo bạn đang import đúng file CSS của bạn

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diemThuong, setDiemThuong] = useState(0);

  // HÀM TỪ ĐIỂN PHÂN TÍCH THÔNG TIN CHI TIẾT
  const getThongTinChiTiet = (loaiRac) => {
    if (!loaiRac) return null;

    if (loaiRac.includes("Không phải rác")) {
      return { 
        title: "Sinh Vật Sống", taiChe: "Không áp dụng", 
        goiY: "Không quét con người/động vật!", 
        luuY: "Hãy cất điện thoại đi và vuốt ve chúng nhé 🐈", 
        mau: "#ffb300", icon: "⚠️" 
      };
    }
    if (loaiRac.includes("Tái Chế")) {
      return { 
        title: "Rác Tái Chế", taiChe: "♻️ Khả năng tái chế: Cao", 
        goiY: "Thùng rác MÀU TRẮNG", 
        luuY: "Nhớ đổ sạch nước, rửa sơ và làm xẹp trước khi vứt nhé!", 
        mau: "#1976d2", icon: "📦" 
      };
    }
    if (loaiRac.includes("Hữu Cơ")) {
      return { 
        title: "Rác Hữu Cơ", taiChe: "🌱 Phân hủy sinh học", 
        goiY: "Thùng rác MÀU XANH LÁ", 
        luuY: "Tuyệt đối không bỏ kèm túi nilon vào thùng hữu cơ!", 
        mau: "#388e3c", icon: "🍎" 
      };
    }
    if (loaiRac.includes("Cồng Kềnh")) {
      return { 
        title: "Rác Cồng Kềnh", taiChe: "🔄 Tùy thuộc vào vật liệu", 
        goiY: "Điểm thu gom rác phường/xã", 
        luuY: "Có thể gọi công ty môi trường đô thị hỗ trợ xe tải thu gom.", 
        mau: "#9c27b0", icon: "🛋️" 
      };
    }
    return { 
      title: "Rác Vô Cơ / Khác", taiChe: "❌ Không thể tái chế", 
      goiY: "Thùng rác MÀU CAM / XÁM", 
      luuY: "Gói kín cẩn thận nếu có chứa nước hoặc bốc mùi hôi.", 
      mau: "#d32f2f", icon: "🗑️" 
    };
  };

  // HÀM XỬ LÝ KHI NGƯỜI DÙNG TẢI ẢNH LÊN
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setResult(null); 
      setIsAnalyzing(true);
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("https://ecovision-api-ki25.onrender.com/api/phan-loai/", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data); 
          
          // Tặng điểm thưởng vui nhộn
          if (data.loai_rac_chinh.includes("Cồng Kềnh")) {
            setDiemThuong(prev => prev + 500);
          } else if (data.loai_rac_chinh.includes("Tái Chế")) {
            setDiemThuong(prev => prev + 200);
          }
        } else {
          setResult({
            loai_rac_chinh: "Rác Vô Cơ / Khác (Server phản hồi lỗi)",
            do_tu_tin_chinh: "0%"
          });
        }
      } catch (error) {
        console.error("Lỗi kết nối:", error);
        setResult({
          loai_rac_chinh: "Rác Vô Cơ / Khác (Chưa bật Server Python)",
          do_tu_tin_chinh: "0%"
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const info = getThongTinChiTiet(result?.loai_rac_chinh);

  return (
    <div className="app-container">
      <header className="header">
        <h1>🌱 EcoVision AI v2.0</h1>
        <p>Hệ thống Nhận diện & Phân loại Rác thải bằng Gemini AI</p>
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
            style={{ display: 'none' }} // Ẩn nút chọn file mặc định đi cho đẹp
          />
        </div>

        {/* KHU VỰC HIỂN THỊ ẢNH */}
        {image && (
          <div className="preview-section" style={{ marginTop: '20px', textAlign: 'center' }}>
            <img src={image} alt="Kết quả phân tích" style={{ maxWidth: '100%', borderRadius: '10px' }} />
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-state" style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Mô hình Gemini đang phân tích hình ảnh và ngữ cảnh...</p>
          </div>
        )}

        {/* THẺ HIỂN THỊ KẾT QUẢ TỪ AI GEMINI */}
        {info && !isAnalyzing && (
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "20px",
            marginTop: "20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            textAlign: "left",
            borderTop: `6px solid ${info.mau}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
              <span style={{ fontSize: "40px", marginRight: "15px" }}>{info.icon}</span>
              <div>
                <h2 style={{ margin: "0", color: info.mau, fontSize: "22px" }}>{info.title}</h2>
                <span style={{ fontSize: "14px", color: "#666", fontWeight: "bold" }}>
                  AI nhận diện: {result?.loai_rac_chinh}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "15px", lineHeight: "1.8", color: "#444" }}>
              <p style={{ margin: "10px 0" }}>
                <strong>Khả năng tái chế:</strong> <span style={{ color: info.mau, fontWeight: "bold", backgroundColor: `${info.mau}20`, padding: "4px 8px", borderRadius: "8px" }}>{info.taiChe}</span>
              </p>
              <p style={{ margin: "10px 0" }}>
                <strong>📍 Nơi vứt gợi ý:</strong> {info.goiY}
              </p>
              <p style={{ margin: "10px 0", backgroundColor: "#fff8e1", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #ffc107" }}>
                <strong>💡 Lưu ý quan trọng:</strong> {info.luuY}
              </p>
              <p style={{ margin: "10px 0", fontSize: "13px", color: "#888", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                Độ tự tin của AI: {result?.do_tu_tin_chinh}
              </p>
            </div>
          </div>
        )}
        
        {/* Điểm thưởng */}
        {diemThuong > 0 && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2 style={{ color: "#ff9800" }}>⭐ Tổng điểm: {diemThuong}</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;