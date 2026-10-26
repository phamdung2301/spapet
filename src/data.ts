export type PetKind = "dog" | "cat";

export interface Service {
  id: string;
  name: string;
  pets: PetKind[];
  price: number;
  desc: string;
  tag: string;
}

export interface TeamMember {
  name: string;
  role: string;
  note: string;
}

export interface Testimonial {
  name: string;
  text: string;
}

export const services: Service[] = [
  { id: "bath", name: "Tắm & sấy cơ bản", pets: ["dog", "cat"], price: 250000, desc: "Tắm nước ấm, dầu gội dịu nhẹ, sấy và chải lông.", tag: "Nhẹ nhàng" },
  { id: "groom", name: "Cắt tỉa toàn diện", pets: ["dog", "cat"], price: 450000, desc: "Cắt tỉa theo giống, vệ sinh tai, cắt móng, tạo kiểu.", tag: "Tạo kiểu" },
  { id: "spa", name: "Spa thư giãn", pets: ["dog", "cat"], price: 650000, desc: "Massage, ủ dưỡng lông, xông tinh dầu nhẹ, kiểm tra da.", tag: "Thư giãn" },
  { id: "hotel", name: "Giữ bé ban ngày", pets: ["dog"], price: 350000, desc: "Chăm sóc ban ngày, sân chơi giám sát, ăn theo lịch của bé.", tag: "Ban ngày" },
  { id: "skin", name: "Chăm sóc da & lông", pets: ["dog", "cat"], price: 550000, desc: "Ủ dưỡng phục hồi, kiểm tra da, tư vấn dinh dưỡng lông.", tag: "Phục hồi" },
  { id: "puppy", name: "Buổi đầu cho bé con", pets: ["dog", "cat"], price: 300000, desc: "Làm quen từ từ, tắm ngắn, thưởng và chơi sau mỗi bước.", tag: "Bé mới" },
];

export const team: TeamMember[] = [
  { name: "Minh Anh", role: "Groomer trưởng — 6 năm", note: "Chuyên chó lông dài và mèo nhạy cảm." },
  { name: "Quốc Bảo", role: "Groomer — cắt tỉa tạo kiểu", note: "Chuyên Poodle, Samoyed và các giống cần tạo form." },
  { name: "Thu Hà", role: "Chăm sóc & spa", note: "Massage, dưỡng lông và theo dõi da cho bé lớn tuổi." },
];

export const testimonials: Testimonial[] = [
  { name: "Chị Lan — chủ của Mít (Mèo Anh)", text: "Mít vốn sợ tắm mà về nhà thơm, lông mượt, không hề stress." },
  { name: "Anh Đức — chủ của Bơ (Corgi)", text: "Cắt form gọn, móng sạch, báo cáo sau mỗi buổi rất rõ ràng." },
  { name: "Chị Ngọc — chủ của Sữa (Golden)", text: "Spa xong Sữa ngủ ngon cả buổi chiều, lông bóng hẳn lên." },
];

export const processSteps = [
  { n: "01", title: "Kiểm tra", text: "Kiểm tra sức khỏe, da và lông trước khi tắm." },
  { n: "02", title: "Tắm & massage", text: "Tắm nước ấm, massage thư giãn, dừng nghỉ khi bé cần." },
  { n: "03", title: "Cắt tỉa", text: "Cắt tỉa theo yêu cầu và theo giống, vệ sinh tai, móng." },
  { n: "04", title: "Sấy & bàn giao", text: "Sấy, chải, kiểm tra cuối và gửi báo cáo cho chủ." },
];

export function money(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}

export function petLabel(pets: PetKind[]): string {
  if (pets.length === 2) return "Chó & mèo";
  return pets[0] === "dog" ? "Chó" : "Mèo";
}
