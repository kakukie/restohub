'use client'
import { useState, useRef, useEffect } from 'react'

export default function PhoneMockup3D() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [rotation, setRotation] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    // Subtle floating animation when not hovered
    useEffect(() => {
        if (isHovered) return

        let animationFrameId: number;
        let startTime = Date.now();

        const animate = () => {
            const time = (Date.now() - startTime) / 1000;
            // Subtle sine wave animation: max 2 degrees rotation
            setRotation({
                x: Math.sin(time) * 2,
                y: Math.cos(time * 0.8) * 3
            })
            animationFrameId = requestAnimationFrame(animate)
        }

        animate()
        return () => cancelAnimationFrame(animationFrameId)
    }, [isHovered])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        setIsHovered(true)
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Calculate rotation (-15 to +15 degrees depending on mouse pos)
        const rotateX = ((y - centerY) / centerY) * -15 // invert Y so it leans toward mouse
        const rotateY = ((x - centerX) / centerX) * 15

        setRotation({ x: rotateX, y: rotateY })
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    return (
        <div
            ref={containerRef}
            className="relative lg:h-[600px] w-full flex items-center justify-center xl:justify-end pr-0 xl:pr-16"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background iPad / POS terminal (Static) */}
            <div
                className="absolute w-[450px] md:w-[600px] h-[350px] md:h-[450px] bg-slate-800 rounded-[2.5rem] border-[12px] border-[#1e293b] overflow-hidden translate-x-[-15%] xl:translate-x-[-25%] -translate-y-[5%] z-0 hidden md:block transition-transform duration-700 ease-out"
                style={{
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
                    transform: `rotateX(${-10 + rotation.x * 0.3}deg) rotateY(${15 + rotation.y * 0.3}deg)`
                }}
            >
                <div className="w-full h-full bg-slate-50 dark:bg-slate-900 p-6 flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 z-10">
                        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        <div className="flex gap-4">
                            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 flex-1 z-10">
                        <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"></div>
                        <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"></div>
                        <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"></div>
                        <div className="col-span-2 h-32 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"></div>
                        <div className="h-32 bg-[#00a669]/10 rounded-2xl border border-[#00a669]/20 flex items-center justify-center hover:bg-[#00a669]/20 transition-colors cursor-pointer group">
                            <span className="material-symbols-outlined text-[#00a669] text-3xl group-hover:scale-110 transition-transform">add_circle</span>
                        </div>
                    </div>
                    {/* Glass glare effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50 pointer-events-none"></div>
                </div>
            </div>

            {/* Foreground Interactive 3D Phone App Mockup */}
            <div
                className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-[10px] border-slate-900 overflow-hidden z-10 cursor-pointer group"
                style={{
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.4), 0 30px 60px -30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255,255,255,0.1)',
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(-20px)`,
                    transition: isHovered ? 'transform 0.1s ease-out' : 'transform 1s ease-out'
                }}
                onClick={() => setIsHovered(!isHovered)}
            >
                {/* iPhone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-30 flex justify-center">
                    <div className="w-12 h-1.5 bg-black rounded-full mt-2"></div>
                </div>

                {/* App Screen Content */}
                <div className="w-full h-full bg-slate-50 dark:bg-[#0B0F1A] flex flex-col relative overflow-hidden z-20">

                    <div className="h-44 bg-gradient-to-br from-[#00a669] to-emerald-800 p-6 flex flex-col justify-end text-white relative">
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        <div className="relative z-10">
                            {/* Meenuin Logo / Brand Icon */}
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mb-4 flex items-center justify-center border border-white/30 shadow-sm">
                                <span className="text-[#00a669] bg-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-xl leading-none">M</span>
                            </div>
                            <h4 className="font-bold text-xl mb-1 group-hover:text-emerald-200 transition-colors">Aroma Nusantara</h4>
                            <p className="text-emerald-100/80 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Jakarta Selatan</p>
                        </div>
                    </div>

                    <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-20">
                        {/* Category Pills */}
                        <div className="flex gap-2 overflow-x-hidden">
                            <div className="px-4 py-1.5 bg-emerald-100 dark:bg-[#00a669]/20 text-[#00a669] dark:text-[#00a669] text-xs font-bold rounded-full border border-emerald-200 dark:border-[#00a669]/40 hover:bg-emerald-200 transition-colors cursor-pointer whitespace-nowrap">Makanan</div>
                            <div className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#00a669] transition-colors cursor-pointer whitespace-nowrap">Minuman</div>
                            <div className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#00a669] transition-colors cursor-pointer whitespace-nowrap">Snacks</div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-4">
                            {/* Item 1 */}
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#00a669]/50 transition-all cursor-pointer">
                                <div className="min-w-[4rem] w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">restaurant</span>
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">Nasi Goreng Spesial</h5>
                                    <p className="text-[10px] text-slate-500 truncate">Dengan telur & ayam</p>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[#00a669] dark:text-[#00a669] text-xs font-black">Rp 35.000</span>
                                        <div className="w-6 h-6 rounded-full bg-[#00a669] hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-colors flex-shrink-0"><span className="material-symbols-outlined text-[14px]">add</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#00a669]/50 transition-all cursor-pointer">
                                <div className="min-w-[4rem] w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">set_meal</span>
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">Mie Goreng Seafood</h5>
                                    <p className="text-[10px] text-slate-500 truncate">Udang & Cumi segar</p>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[#00a669] dark:text-[#00a669] text-xs font-black">Rp 42.000</span>
                                        <div className="w-6 h-6 rounded-full bg-[#00a669] hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-colors flex-shrink-0"><span className="material-symbols-outlined text-[14px]">add</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Item 3 */}
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#00a669]/50 transition-all cursor-pointer">
                                <div className="min-w-[4rem] w-16 h-16 bg-gradient-to-br from-amber-300 to-orange-400 rounded-xl flex items-center justify-center text-white shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">local_cafe</span>
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">Es Teh Manis</h5>
                                    <p className="text-[10px] text-slate-500 truncate">Segar & Manis pas</p>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[#00a669] dark:text-[#00a669] text-xs font-black">Rp 8.000</span>
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-default"><span className="material-symbols-outlined text-[14px]">check</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-5 right-5 z-40">
                        <div className="w-full h-14 bg-slate-900 dark:bg-slate-950 shadow-xl shadow-[#00a669]/20 rounded-2xl flex items-center justify-between px-5 text-white cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#00a669]/20 text-[#00a669] flex items-center justify-center">
                                    <span className="text-xs font-bold font-mono">2</span>
                                </div>
                                <span className="text-sm font-bold">Total: Rp 77.000</span>
                            </div>
                            <span className="material-symbols-outlined hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                    </div>

                    {/* Fake Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-300 dark:bg-slate-700 rounded-full z-50"></div>
                    {/* Phone glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-30 pointer-events-none z-50"></div>
                </div>
            </div>
        </div>
    )
}
