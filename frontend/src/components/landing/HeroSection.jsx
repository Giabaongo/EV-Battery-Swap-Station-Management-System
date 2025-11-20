import { Button } from "../ui/button"
import { Link } from "react-router-dom"

// Component Hero Section với video nền tràn màn hình - Phần đầu tiên user nhìn thấy khi vào landing page
export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video nền tràn toàn màn hình - Tạo visual impact mạnh mẽ */}
      <video
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover mt-12"
        autoPlay          // Tự động phát khi page load
        muted             // Không phát âm thanh (tránh làm phiền user)
        loop              // Lặp lại video sau khi kết thúc
        playsInline       // Phát video inline (không toàn màn hình trên mobile)
      >
        <source src="/images/okne.mp4" type="video/mp4" />
      </video>

      {/* Lớp overlay màu đen với độ trong suốt (opacity: 40%) để làm text nổi bật hơn so với video nền */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Nội dung chính: tiêu đề, mô tả, và nút CTA (Call To Action) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4 max-w-3xl mx-auto">
        {/* Tiêu đề chính - Branding: "KIRI SWAP CONVENIENCE" */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          KIRI SWAP
          <span className="block text-WHITE">CONVENIENCE</span>
        </h1>

        {/* Mô tả dịch vụ - Giải thích value proposition của KIRI Swap */}
        <p className="mt-4 text-lg md:text-xl opacity-90">
          Experience the future of EV charging with our automated battery swap stations
        </p>

        {/* Nút đăng ký tài khoản - CTA button để khuyến khích user đăng ký */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Link to="/register">Sign up now →</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}