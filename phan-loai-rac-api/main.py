import os
import json
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# =============================================================
# 1. NẠP FILE .ENV VÀ CẤU HÌNH BIẾN MÔI TRƯỜNG
# =============================================================
load_dotenv()

app = FastAPI()

# =============================================================
# 2. CẤU HÌNH CORS (BẮT BUỘC ĐỂ WEB REACT KẾT NỐI ĐƯỢC)
# =============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn kết nối để tránh lỗi chặn cổng
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================
# 3. KIỂM TRA VÀ KẾT NỐI API KEY GEMINI
# =============================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ LỖI NGHIÊM TRỌNG: Chưa tìm thấy GEMINI_API_KEY trong file .env!")
    print("👉 Hãy chắc chắn bạn đã tạo file tên là '.env' nằm cùng thư mục với file main.py này.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Đã kết nối cấu hình Gemini API Key thành công!")

# =============================================================
# 4. API PHÂN LOẠI RÁC (Đường dẫn có dấu / ở cuối)
# =============================================================
@app.post("/api/phan-loai/")
async def phan_loai_rac(file: UploadFile = File(...)):
    try:
        # Đọc dữ liệu ảnh truyền lên từ React
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Gọi mô hình Gemini 1.5 Pro (Bản xử lý hình ảnh và suy luận tốt nhất hiện tại)
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Câu lệnh Prompt điều khiển bộ não AI
        prompt = """
        Bạn là một chuyên gia phân loại rác thải thông minh và bảo vệ môi trường tại Việt Nam.
        Hãy phân tích vật thể chính trong ảnh, suy luận kích thước thật ngoài đời của nó (bất chấp việc chụp gần hay xa) và phân loại vào đúng 1 trong 5 nhóm rác sau:

        1. "Không phải rác": Con người, chim chóc, chó, mèo, cây cảnh đang trồng hoặc các sinh vật sống khác.
        2. "Rác Tái Chế": Chai nhựa, lon nước, hộp giấy, thùng carton, giấy báo, vỏ lon bia/nước ngọt...
        3. "Rác Hữu Cơ": Thức ăn thừa, rau củ quả hư, bã trà, bã cà phê, hoa lá héo rơi rụng...
        4. "Rác Cồng Kềnh": Các vật thể nội thất kích thước lớn (ghế sofa, nệm cũ, tủ quần áo, bồn cầu, giường) hoặc đồ điện tử gia dụng lớn (tivi, tủ lạnh, máy giặt). 
           LƯU Ý ĐẶC BIỆT: Nếu vật thể nhỏ như bàn phím, chuột máy tính, điện thoại, điều khiển remote... dù chụp tràn màn hình thì ngoài đời kích thước thật của nó vẫn nhỏ -> KHÔNG ĐƯỢC xếp vào cồng kềnh, hãy xếp vào nhóm Rác Vô Cơ.
        5. "Rác Vô Cơ / Khác": Túi nilon, khẩu trang dùng một lần, hộp xốp, các mảnh vỡ sành sứ, đồ điện tử nhỏ lẻ, găng tay cao su...

        YÊU CẦU BẮT BUỘC: Chỉ trả về duy nhất một chuỗi định dạng JSON hợp lệ, KHÔNG bọc trong thẻ markdown ```json, KHÔNG viết thêm bất kỳ lời chào hay giải thích nào bên ngoài. Cấu trúc JSON phải chính xác 100% như sau:
        {
          "loai_rac_chinh": "Tên Nhóm Rác (Tên vật thể tiếng Việt cụ thể)",
          "do_tu_tin_chinh": "Ước lượng độ chính xác từ 85% đến 100%, ví dụ: 95%"
        }
        """
        
        # Gửi dữ liệu lên mây Google để xử lý
        response = model.generate_content([prompt, image])
        
        # Làm sạch chuỗi dữ liệu trả về (Đề phòng trường hợp AI tự ý chèn ký tự ```json)
        text_data = response.text.strip()
        if text_data.startswith("```json"):
            text_data = text_data[7:]
        if text_data.endswith("```"):
            text_data = text_data[:-3]
        text_data = text_data.strip()
        
        # Chuyển đổi chuỗi văn bản thành đối tượng JSON chuẩn và bắn ngược về cho React
        ket_qua_json = json.loads(text_data)
        return ket_qua_json

    except Exception as e:
        print(f"❌ Lỗi xử lý hệ thống: {e}")
        # Cơ chế dự phòng (Fallback) nếu có lỗi xảy ra để trang web React của bạn không bị đứng hình hoặc lỗi giao diện
        return {
            "loai_rac_chinh": "Rác Vô Cơ / Khác (Hệ thống AI đang bận)",
            "do_tu_tin_chinh": "0%"
        }