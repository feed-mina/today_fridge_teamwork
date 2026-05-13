"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './page.module.css';
import PrivateLayout from '@/components/layout/private/PrivateLayout';
import { mealApi } from '@/api/mealApi';
import { healthReportApi } from '@/api/healthReportApi';
import { useRouter } from 'next/navigation';

export default function MealPage() {
    const router = useRouter();
    const [dailyData, setDailyData] = useState(null);
    const [mealLogs, setMealLogs] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const [canRequestRecommendation, setCanRequestRecommendation] = useState(true);
    const [hoveredDay, setHoveredDay] = useState(null);

    useEffect(() => {
        fetchData();
        const lastDate = localStorage.getItem('lastMealRecommendationDate');
        const today = new Date().toDateString();
        if (lastDate === today) {
            setCanRequestRecommendation(false);
        }
    }, [activeTab]);

    const handleRecommendation = async () => {
        if (!canRequestRecommendation) {
            router.push('/health-report');
            return;
        }
        try {
            await healthReportApi.generateHealthReport();
            const today = new Date().toDateString();
            localStorage.setItem('lastMealRecommendationDate', today);
            setCanRequestRecommendation(false);
            router.push('/health-report');
        } catch (error) {
            console.error("Failed to get recommendation:", error);
            alert('건강 레포트를 생성하는데 실패했습니다.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'daily') {
                const [dailyRes, logsRes] = await Promise.all([
                    mealApi.getDailyNutrition(),
                    mealApi.getMealLogs()
                ]);
                setDailyData(dailyRes);
                const logs = Array.isArray(logsRes) ? logsRes : (logsRes?.data || []);
                setMealLogs(logs);
            } else {
                const report = await (activeTab === 'weekly' ? mealApi.getWeeklyReport() : mealApi.getMonthlyReport());
                setReportData(report?.data || report);
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} data:`, error);
            if (activeTab === 'daily') {
                setDailyData(null);
                setMealLogs([]);
            } else {
                setReportData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const maxCalsForGrid = useMemo(() => {
        if (!reportData?.dailyData?.length) return 2500;
        const max = Math.max(...reportData.dailyData.map(d => Number(d.calories) || 0));
        return Math.ceil(max / 500) * 500 + 500;
    }, [reportData]);

    const renderProgressBar = (label, current, target, colorClass, unit = 'g') => {
        const currentVal = Number(current) || 0;
        const targetVal = Number(target) || 1;
        const percentage = Math.min((currentVal / targetVal) * 100, 100);
        return (
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className="text-xs text-gray-400">
                        <span className="text-gray-900 font-bold">{currentVal.toFixed(1)}</span> / {targetVal.toFixed(0)} {unit}
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };

    const renderLineGraph = () => {
        if (!reportData?.dailyData?.length) return null;
        
        const padding = { top: 40, right: 30, bottom: 40, left: 50 };
        const width = 800;
        const height = 300;
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const data = reportData.dailyData;
        const points = data.map((d, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartWidth,
            y: padding.top + chartHeight - (Number(d.calories || 0) / maxCalsForGrid) * chartHeight,
            value: Number(d.calories || 0),
            date: d.date,
            imputed: d.imputed || d.isImputed
        }));

        const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

        const gridLines = [];
        for (let i = 0; i <= maxCalsForGrid; i += 500) {
            const y = padding.top + chartHeight - (i / maxCalsForGrid) * chartHeight;
            gridLines.push(
                <g key={i}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                    <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{i}</text>
                </g>
            );
        }

        return (
            <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                <div style={{ minWidth: data.length > 15 ? '1000px' : '100%' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        
                        {/* Grid */}
                        {gridLines}
                        
                        {/* Area */}
                        <path d={areaPath} fill="url(#areaGradient)" />
                        
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Points & Interactions */}
                        {points.map((p, i) => (
                            <g key={i} onMouseEnter={() => setHoveredDay(p)} onMouseLeave={() => setHoveredDay(null)}>
                                <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={hoveredDay?.date === p.date ? 6 : 4} 
                                    fill={p.imputed ? "#9ca3af" : "var(--color-primary)"} 
                                    stroke="white" 
                                    strokeWidth="2"
                                    className="transition-all duration-200 cursor-pointer"
                                />
                                <text 
                                    x={p.x} 
                                    y={height - 10} 
                                    textAnchor="middle" 
                                    fontSize="9" 
                                    fill="#6b7280" 
                                    transform={`rotate(-45, ${p.x}, ${height - 10})`}
                                >
                                    {new Date(p.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </text>
                                
                                {/* Invisible hit area */}
                                <rect x={p.x - 15} y={padding.top} width="30" height={chartHeight} fill="transparent" className="cursor-pointer" />
                            </g>
                        ))}

                        {/* Tooltip */}
                        {hoveredDay && (
                            <g>
                                <rect x={hoveredDay.x - 40} y={hoveredDay.y - 35} width="80" height="25" rx="4" fill="rgba(0,0,0,0.8)" />
                                <text x={hoveredDay.x} y={hoveredDay.y - 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                                    {hoveredDay.value.toFixed(0)} kcal
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <PrivateLayout>
            <div className={styles.container}>
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">식단 및 영양 분석</h1>
                        <p className="text-gray-500 mt-2">일일 섭취량을 추적하고 건강한 균형을 유지하세요.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex flex-col items-end">
                            <button onClick={handleRecommendation} className="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-primary text-white hover:bg-primary-hover shadow-md" style={{ backgroundColor: 'var(--color-primary)' }}>
                                {canRequestRecommendation ? 'AI 식단 추천 받기' : '오늘의 추천 결과 보기'}
                            </button>
                            <p className="text-[10px] text-gray-400 mt-1">새로운 분석은 하루에 한 번만 진행됩니다.</p>
                        </div>
                        <div className="flex space-x-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-fit">
                            {['daily', 'weekly', 'monthly'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} style={activeTab === tab ? { backgroundColor: 'var(--color-primary)' } : {}}>
                                    {tab === 'daily' ? '일간' : tab === 'weekly' ? '주간' : '월간'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-80">
                        <div className={styles.loader}></div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'daily' && dailyData && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className={styles.glassCard}>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-bold flex items-center">
                                                <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center mr-3" style={{backgroundColor: 'var(--color-primary-light)'}}>
                                                    <svg className="w-5 h-5 text-primary" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                </span>
                                                일일 섭취 현황
                                            </h2>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-gray-900">{(Number(dailyData.currentCalories) || 0).toFixed(0)} <span className="text-sm font-normal text-gray-400 uppercase tracking-widest">kcal</span></p>
                                                <p className="text-xs text-gray-500">목표: {(Number(dailyData.targetCalories) || 0).toFixed(0)} kcal</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">주요 영양소</h3>
                                                {renderProgressBar('탄수화물', dailyData.currentCarbs, dailyData.targetCarbs, 'bg-emerald-500')}
                                                {renderProgressBar('단백질', dailyData.currentProtein, dailyData.targetProtein, 'bg-rose-500')}
                                                {renderProgressBar('지방', dailyData.currentFat, dailyData.targetFat, 'bg-amber-500')}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">기타 지표</h3>
                                                {renderProgressBar('당류', dailyData.currentSugar, dailyData.targetSugar, 'bg-purple-500')}
                                                {renderProgressBar('나트륨', dailyData.currentSodium, dailyData.targetSodium, 'bg-sky-500', 'mg')}
                                                {renderProgressBar('콜레스테롤', dailyData.currentCholesterol, dailyData.targetCholesterol, 'bg-orange-500', 'mg')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.glassCard}>
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <span className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                                                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                            </span>
                                            오늘의 식사 기록
                                        </h2>
                                        {mealLogs.length > 0 ? (
                                            <div className="space-y-4">
                                                {mealLogs.map((log) => (
                                                    <div key={log.mealId || log.id} className={styles.mealItem}>
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800">{log.recipeTitle || log.mealName}</h4>
                                                                <p className="text-xs text-gray-500">{log.consumedAt ? new Date(log.consumedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : log.time} • {log.servings || 1} servings</p>
                                                            </div>
                                                            <div className="bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20" style={{backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)'}}>기록됨</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                                                <p className="text-gray-400">오늘 기록된 식사가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className={`${styles.glassCard} border-primary/30 bg-primary-light/10`}>
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center mr-3" style={{backgroundColor: 'var(--color-primary-light)'}}>
                                                <svg className="w-5 h-5 text-primary" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                            </span>
                                            영양 조언
                                        </h2>
                                        <div className="space-y-4">
                                            {dailyData.advice && dailyData.advice.length > 0 ? (
                                                dailyData.advice.map((adv, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start group hover:border-primary/30 transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-3 group-hover:scale-125 transition-transform" style={{backgroundColor: 'var(--color-primary)'}}></div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{adv}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">현재 특별한 조언이 없습니다. 잘하고 계세요!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'weekly' || activeTab === 'monthly') && reportData && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: '평균 칼로리', value: (Number(reportData.averageCalories) || 0).toFixed(0), unit: 'kcal', color: 'text-blue-500' },
                                        { label: '평균 탄수화물', value: (Number(reportData.averageCarbs) || 0).toFixed(1), unit: 'g', color: 'text-emerald-500' },
                                        { label: '평균 단백질', value: (Number(reportData.averageProtein) || 0).toFixed(1), unit: 'g', color: 'text-rose-500' },
                                        { label: '평균 지방', value: (Number(reportData.averageFat) || 0).toFixed(1), unit: 'g', color: 'text-amber-500' }
                                    ].map((stat, i) => (
                                        <div key={i} className={styles.statCard}>
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value} <span className="text-xs font-normal opacity-50">{stat.unit}</span></p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <div className={styles.glassCard}>
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold">영양 섭취 추이</h3>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center text-[10px] text-gray-400">
                                                        <div className="w-2 h-2 rounded-full bg-primary mr-1.5" style={{backgroundColor: 'var(--color-primary)'}}></div> 실제 기록
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-gray-400">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-1.5"></div> 추정치
                                                    </div>
                                                </div>
                                            </div>
                                            {renderLineGraph()}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className={styles.glassCard}>
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">보조 영양소 평균</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: '당류', value: Number(reportData.averageSugar) || 0, unit: 'g' },
                                                    { label: '나트륨', value: Number(reportData.averageSodium) || 0, unit: 'mg' },
                                                    { label: '콜레스테롤', value: Number(reportData.averageCholesterol) || 0, unit: 'mg' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                        <span className="text-sm text-gray-500">{item.label}</span>
                                                        <span className="text-sm font-bold text-gray-800">{item.value.toFixed(1)} {item.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {reportData.missingDaysImputed > 0 && (
                                            <div className="bg-primary-light border border-primary/10 rounded-2xl p-5" style={{backgroundColor: 'var(--color-primary-light)', opacity: 0.8}}>
                                                <div className="flex items-center text-primary mb-2" style={{color: 'var(--color-primary)'}}>
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    <span className="text-xs font-bold uppercase tracking-tighter">데이터 알림</span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">기록이 누락된 <span className="text-primary font-bold" style={{color: 'var(--color-primary)'}}>{reportData.missingDaysImputed}일</span>의 데이터가 있습니다. 추정치를 적용했습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PrivateLayout>
    );
}
