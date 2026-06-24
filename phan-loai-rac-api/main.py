import torch
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import base64

app = FastAPI()

# Cấu hình CORS mở cổng kết nối cho React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧠 TẢI MÔ HÌNH YOLOv8 NANO (Siêu nhẹ, chạy cực nhanh trên CPU mọi laptop)
print("Đang khởi động bộ não YOLOv8...")
model = YOLO("yolov8n.pt") 
print("YOLOv8 ĐÃ SẴN SÀNG!")

@app.get("/")
def kiem_tra():
    return {"trang_thai": "YOLO Server đang chạy tốt"}

@app.post("/api/phan-loai")
async def phan_loai_rac(file: UploadFile = File(...)):
    # 1. Đọc file ảnh từ React gửi lên và chuyển thành ma trận ảnh OpenCV
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 2. Cho YOLOv8 quét bức ảnh
    results = model(img)
    
    loai_rac_chinh = "Chưa xác định"
    loai_thung_rac = "🗑️ Hãy bỏ vào THÙNG RÁC CHUNG!"
    do_tu_tin_chinh = "0%"
    
    # 3. Duyệt qua tất cả các vật thể mà YOLO tìm thấy trong hình để vẽ khung
    boxes = results[0].boxes
    for box in boxes:
        # Lấy tọa độ khung vuông [xmin, ymin, xmax, ymax]
        xyxy = box.xyxy[0].tolist()
        x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
        
        # Lấy độ tự tin (%) và tên vật thể bằng tiếng Anh (ví dụ: bottle, banana...)
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        ten_tieng_anh = model.names[cls]
        
        # --- LOGIC PHÂN LOẠI RÁC THEO TIÊU CHUẨN ---
        # Nhóm Tái Chế
        if ten_tieng_anh in ["bottle", "can", "cup", "box", "paper", "cardboard", "bottle-cap"]:
            loai_rac_chinh = f"Rác Tái Chế ({ten_tieng_anh})"
            loai_thung_rac = "♻️ Hãy làm sạch và bỏ vào THÙNG MÀU TRẮNG!"
            mau_khung = (255, 0, 0) # Màu Xanh Dương (Bên OpenCV là BGR)
            
        # Nhóm Hữu Cơ
        elif ten_tieng_anh in ["apple", "banana", "orange", "broccoli", "carrot", "sandwich", "cake", "food"]:
            loai_rac_chinh = f"Rác Hữu Cơ ({ten_tieng_anh})"
            loai_thung_rac = "🌱 Thức ăn thừa/Rau củ. Hãy bỏ vào THÙNG MÀU XANH LÁ!"
            mau_khung = (0, 255, 0) # Màu Xanh Lá
            
        # Các vật thể khác mặc định là rác vô cơ
        else:
            loai_rac_chinh = f"Rác Vô Cơ / Khác ({ten_tieng_anh})"
            loai_thung_rac = "🗑️ Không thể tái chế. Hãy bỏ vào THÙNG MÀU CAM / XÁM!"
            mau_khung = (0, 0, 255) # Màu Đỏ
            
        do_tu_tin_chinh = f"{conf * 100:.1f}%"
        
        # 4. Vẽ khung hình chữ nhật lên vật thể
        cv2.rectangle(img, (x1, y1), (x2, y2), mau_khung, 3)
        
        # Vẽ nhãn chữ đè lên đầu khung vuông
        label = f"{ten_tieng_anh} {do_tu_tin_chinh}"
        cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, mau_khung, 2)

    # 5. Mã hóa bức ảnh đã vẽ khung thành chuỗi Base64 để gửi về giao diện Web
    _, encoded_img = cv2.imencode('.jpg', img)
    base64_image = base64.b64encode(encoded_img).decode('utf-8')
    
    # 6. Trả kết quả về cho React
    return {
        "type": loai_rac_chinh,
        "action": loai_thung_rac,
        "confidence": do_tu_tin_chinh,
        "annotated_image": f"data:image/jpeg;base64,{base64_image}" # Đường dẫn ảnh chứa khung vuông
    }