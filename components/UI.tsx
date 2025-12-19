import React, { useState } from 'react';
import { useStore } from '../store';
import { ShapeType, VideoSizeType, Language } from '../types';
import { Camera, CameraOff, Hand, Heart, Flower, Globe, ScanFace, Sparkles, Settings, Rotate3d, Wind, Zap, Monitor, X, Languages, Battery, GripHorizontal } from 'lucide-react';

// Translation Dictionary
const translations = {
  'zh-TW': {
    title: '手勢流動',
    waiting: '等待手部訊號...',
    enableCam: '請開啟相機',
    detected: '手部已連線',
    panelTitle: '設定面板',
    gesture: '手勢功能',
    rotate: '手掌旋轉',
    pinch: '手掌縮放',
    scatter: '揮手打散',
    hole: '彈指衝擊 (穿透)',
    videoSize: '視訊畫面大小',
    shape: '形狀模板',
    color: '顏色',
    count: '粒子數量',
    size: '粒子大小',
    noise: '噪聲強度',
    settings: '設定',
    language: '語言',
    performance: '效能模式',
    perfHigh: '高畫質',
    perfSaver: '省電/流暢',
    footerOn: '請在光線充足處使用。手指彈射需明顯加速。',
    footerOff: '相機已關閉。請開啟相機以使用手勢控制功能。',
  },
  'zh-CN': {
    title: '手势流动',
    waiting: '等待手部信号...',
    enableCam: '请开启相机',
    detected: '手部已连接',
    panelTitle: '设置面板',
    gesture: '手势功能',
    rotate: '手掌旋转',
    pinch: '手掌缩放',
    scatter: '挥手打散',
    hole: '弹指冲击 (穿透)',
    videoSize: '视频画面大小',
    shape: '形状模板',
    color: '颜色',
    count: '粒子数量',
    size: '粒子大小',
    noise: '噪声强度',
    settings: '设置',
    language: '语言',
    performance: '性能模式',
    perfHigh: '高画质',
    perfSaver: '省电/流畅',
    footerOn: '请在光线充足处使用。手指弹射需明显加速。',
    footerOff: '相机已关闭。请开启相机以使用手势控制功能。',
  },
  'en': {
    title: 'Gesture Flow',
    waiting: 'Waiting for hand...',
    enableCam: 'Please turn on camera',
    detected: 'Hand Detected',
    panelTitle: 'Settings',
    gesture: 'Gestures',
    rotate: 'Palm Rotate',
    pinch: 'Palm Pinch/Zoom',
    scatter: 'Wave Scatter',
    hole: 'Finger Snap',
    videoSize: 'Video Size',
    shape: 'Shapes',
    color: 'Color',
    count: 'Count',
    size: 'Size',
    noise: 'Noise',
    settings: 'Settings',
    language: 'Language',
    performance: 'Performance',
    perfHigh: 'High Quality',
    perfSaver: 'Battery Saver',
    footerOn: 'Use in good lighting. Snap/Flick needs speed.',
    footerOff: 'Camera off. Enable camera for gesture control.',
  },
  'ja': {
    title: 'ジェスチャー・フロー',
    waiting: '手信号を待機中...',
    enableCam: 'カメラをオンにしてください',
    detected: '手を検出しました',
    panelTitle: '設定',
    gesture: 'ジェスチャー',
    rotate: '手のひら回転',
    pinch: '手のひらズーム',
    scatter: '手を振って散らす',
    hole: '指パッチン衝撃',
    videoSize: 'ビデオサイズ',
    shape: '形状',
    color: '色',
    count: '粒子数',
    size: '粒子サイズ',
    noise: 'ノイズ強度',
    settings: '設定',
    language: '言語',
    performance: 'パフォーマンス',
    perfHigh: '高品質',
    perfSaver: '省電力',
    footerOn: '明るい場所で使用してください。',
    footerOff: 'カメラはオフです。',
  },
  'ko': {
    title: '제스처 플로우',
    waiting: '손 신호 대기 중...',
    enableCam: '카메라를 켜주세요',
    detected: '손 감지됨',
    panelTitle: '설정',
    gesture: '제스처',
    rotate: '손바닥 회전',
    pinch: '손바닥 줌',
    scatter: '손 흔들어 흩뿌리기',
    hole: '손가락 튕기기',
    videoSize: '비디오 크기',
    shape: '모양',
    color: '색상',
    count: '입자 수',
    size: '입자 크기',
    noise: '노이즈 강도',
    settings: '설정',
    language: '언어',
    performance: '성능 모드',
    perfHigh: '고화질',
    perfSaver: '절전 모드',
    footerOn: '밝은 곳에서 사용하세요.',
    footerOff: '카메라가 꺼져 있습니다.',
  }
};

const ShapeIcon = ({ shape }: { shape: ShapeType }) => {
  switch (shape) {
    case 'heart': return <Heart size={20} />;
    case 'flower': return <Flower size={20} />;
    case 'saturn': return <Globe size={20} />;
    case 'scan': return <ScanFace size={20} />;
    case 'fireworks': return <Sparkles size={20} />;
  }
};

export const UI: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Optimized atomic selectors to prevent re-renders on every frame
  const currentShape = useStore(state => state.currentShape);
  const setShape = useStore(state => state.setShape);
  const config = useStore(state => state.config);
  const setConfig = useStore(state => state.setConfig);
  const isCameraEnabled = useStore(state => state.isCameraEnabled);
  const toggleCamera = useStore(state => state.toggleCamera);
  const handDetected = useStore(state => state.handState.detected); // Only re-renders if detected bool changes
  const isRotationControlEnabled = useStore(state => state.isRotationControlEnabled);
  const toggleRotationControl = useStore(state => state.toggleRotationControl);
  const isScatterEnabled = useStore(state => state.isScatterEnabled);
  const toggleScatter = useStore(state => state.toggleScatter);
  const isHoleEnabled = useStore(state => state.isHoleEnabled);
  const toggleHole = useStore(state => state.toggleHole);
  const isPinchEnabled = useStore(state => state.isPinchEnabled);
  const togglePinch = useStore(state => state.togglePinch);
  const videoSize = useStore(state => state.videoSize);
  const setVideoSize = useStore(state => state.setVideoSize);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const performanceMode = useStore(state => state.performanceMode);
  const setPerformanceMode = useStore(state => state.setPerformanceMode);

  const t = translations[language];
  const shapes: ShapeType[] = ['heart', 'flower', 'saturn', 'scan', 'fireworks'];

  const videoMarginClass = isCameraEnabled 
    ? (videoSize === 'large' ? 'ml-[330px]' : videoSize === 'medium' ? 'ml-[170px]' : 'ml-[130px]')
    : 'ml-0';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between z-10 overflow-hidden">
      
      {/* Top Header & Stats */}
      <div className={`flex justify-between items-start transition-all duration-300 ${videoMarginClass}`}>
        <div>
          {!isCameraEnabled && (
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-sm">
              {t.title}
            </h1>
          )}
          <p className="text-xs text-gray-400 mt-1 h-5">
            {!isCameraEnabled ? (
                <span className="text-gray-500 opacity-80">{t.enableCam}</span>
            ) : handDetected ? (
                <span className="text-green-400 flex items-center gap-1"><Hand size={12}/> {t.detected}</span>
            ) : (
                <span className="text-yellow-500 opacity-70">{t.waiting}</span>
            )}
          </p>
        </div>

        <button 
          onClick={toggleCamera}
          className={`pointer-events-auto p-3 rounded-full transition-all duration-300 ${isCameraEnabled ? 'bg-red-500/20 hover:bg-red-500/40 text-red-200' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          title={isCameraEnabled ? "ON/OFF" : "ON/OFF"}
        >
          {isCameraEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
        </button>
      </div>

      {/* Control Panel Container */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end">
        
        {isCollapsed && (
            <button 
                onClick={() => setIsCollapsed(false)}
                className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-full hover:bg-white/10 hover:scale-110 transition-all duration-300 shadow-lg group"
            >
                <Settings size={28} className="text-gray-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-500" />
            </button>
        )}

        {!isCollapsed && (
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-80 shadow-2xl animate-fade-in-up flex flex-col max-h-[70vh]">
                
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Settings size={16} /> {t.panelTitle}
                    </h2>
                    <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar grow">
                    
                    <div className="space-y-3 pb-2 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase">
                                <Languages size={14}/> {t.language}
                            </div>
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="bg-white/10 text-xs rounded px-2 py-1 outline-none text-white cursor-pointer hover:bg-white/20"
                            >
                                <option value="zh-TW">繁體中文</option>
                                <option value="zh-CN">简体中文</option>
                                <option value="en">English</option>
                                <option value="ja">日本語</option>
                                <option value="ko">한국어</option>
                            </select>
                        </div>

                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase">
                                <Battery size={14}/> {t.performance}
                            </div>
                            <div className="flex bg-white/5 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setPerformanceMode('high')}
                                    className={`px-2 py-1 text-[10px] rounded transition-all ${performanceMode === 'high' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                                >
                                    {t.perfHigh}
                                </button>
                                <button
                                    onClick={() => setPerformanceMode('saver')}
                                    className={`px-2 py-1 text-[10px] rounded transition-all ${performanceMode === 'saver' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                                >
                                    {t.perfSaver}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.gesture}</label>
                        
                        <div className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-200">
                                <Rotate3d size={16} className="text-blue-400" />
                                <span>{t.rotate}</span>
                            </div>
                            <button onClick={toggleRotationControl} className={`w-9 h-5 rounded-full relative transition-colors ${isRotationControlEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isRotationControlEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-200">
                                <GripHorizontal size={16} className="text-purple-400" />
                                <span>{t.pinch}</span>
                            </div>
                            <button onClick={togglePinch} className={`w-9 h-5 rounded-full relative transition-colors ${isPinchEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPinchEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-200">
                                <Wind size={16} className="text-green-400"/>
                                <span>{t.scatter}</span>
                            </div>
                            <button onClick={toggleScatter} className={`w-9 h-5 rounded-full relative transition-colors ${isScatterEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isScatterEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-200">
                                <Zap size={16} className="text-yellow-400"/>
                                <span>{t.hole}</span>
                            </div>
                            <button onClick={toggleHole} className={`w-9 h-5 rounded-full relative transition-colors ${isHoleEnabled ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isHoleEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {isCameraEnabled && (
                        <div>
                             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Monitor size={12} /> {t.videoSize}
                             </label>
                             <div className="flex bg-white/5 p-1 rounded-lg">
                                {(['small', 'medium', 'large'] as VideoSizeType[]).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setVideoSize(size)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${videoSize === size ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t.shape}</label>
                        <div className="grid grid-cols-5 gap-2">
                            {shapes.map(s => (
                            <button
                                key={s}
                                onClick={() => setShape(s)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentShape === s ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                <ShapeIcon shape={s} />
                            </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">{t.color}</label>
                            </div>
                            <div className="flex gap-2 justify-between">
                                {['#FFD700', '#00ffff', '#ff00ff', '#44ff44', '#ffffff', '#ff4444'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setConfig({ color: c })}
                                        style={{ backgroundColor: c }}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${config.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">{t.count}</label>
                                <span className="text-xs text-blue-300 font-mono">{config.count}</span>
                            </div>
                            <input 
                                type="range" min="1000" max="30000" step="1000" 
                                value={config.count}
                                onChange={(e) => setConfig({ count: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">{t.size}</label>
                                <span className="text-xs text-blue-300 font-mono">{config.size}</span>
                            </div>
                            <input 
                                type="range" min="0.05" max="0.5" step="0.01" 
                                value={config.size}
                                onChange={(e) => setConfig({ size: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">{t.noise}</label>
                                <span className="text-xs text-blue-300 font-mono">{config.noiseStrength}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={config.noiseStrength}
                                onChange={(e) => setConfig({ noiseStrength: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 text-[10px] text-gray-500 leading-relaxed">
                        {isCameraEnabled ? t.footerOn : t.footerOff}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};