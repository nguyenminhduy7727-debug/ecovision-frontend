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
        title: "Không Phải Rác",
        taiChe: "N/A",
        goiY: "Không áp dụng",
        luuY: "Vui lòng chụp đúng vật thể là rác thải cần phân loại.",
        mau: "#607d8b", // Xám mờ
        icon: "❓"
      };
    }
    if (loaiRac.includes("Tái Chế")) {
      return { 
        title: "Rác Tái Chế",
        taiChe: "♻️ Có thể tái chế",
        goiY: "Bỏ vào thùng rác MÀU VÀNG / CAM",
        luuY: "Gồm: Giấy báo, chai nhựa, vỏ lon... Nhớ đổ sạch nước và súc rửa sơ trước khi vứt!",
        mau: "#ff9800", // Cam
        icon: "🥤"
      };
    }
    if (loaiRac.includes("Hữu Cơ")) {
      return {
        title: "Rác Hữu Cơ",
        taiChe: "✅ Có thể ủ phân Compost",
        goiY: "Bỏ vào thùng rác MÀU XANH LÁ",
        luuY: "Gồm: Rau củ quả, thức ăn thừa, xương cá, lá cây... Không bỏ lẫn túi nilon vào sếp nhé!",
        mau: "#4caf50", // Xanh lá
        icon: "🍌"
      };
    }
    if (loaiRac.includes("Cồng Kềnh")) {
      return { 
        title: "Rác Cồng Kềnh", taiChe: "🔄 Tùy thuộc vào vật liệu", 
        taiChe: "🚛 Thu gom theo lịch địa phương",
        goiY: "Đường số 7, KCN Vĩnh Lộc (gần số 362 Đường số 7, Phường Bình Tân).",
        luuY: "⏰ Thời gian: 8g10 - 11g30 Chủ Nhật hàng tuần. ⚠️ Yêu cầu: Nhớ mang theo CCCD/giấy tờ cư trú hoặc đăng ký trước với Trưởng Khu phố sếp nhé!", 
        mau: "#9c27b0",
        icon: "🛋️" 
      };
    }
    return { 
     title: "Rác Thải Khác",
      taiChe: "❌ Không thể tái chế",
      goiY: "Bỏ vào thùng rác MÀU ĐỎ",
      luuY: "Gồm: Mảnh vỡ, tivi hỏng, tàn thuốc... ⚠️ LƯU Ý: Phạt tiền từ 2Tr - 200Tr VNĐ đối với hành vi vứt rác sai quy định (Theo NĐ 45/2022/NĐ-CP). Hotline cung ứng dịch vụ công: 026.6685.8616",
      mau: "#f44336", // Đỏ cảnh báo
      icon: "🗑️"
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