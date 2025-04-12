
import React, { useEffect, useState } from 'react';
import { formatTime } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { Eye } from 'lucide-react';

interface CountdownBannerProps {
  message: string;
  endTime: Date;
  backgroundColor?: string;
  bannerImageUrl?: string | null;
  containerClassName?: string;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({ 
  message, 
  endTime, 
  backgroundColor = 'transparent',
  bannerImageUrl = null,
  containerClassName = 'w-full'
}) => {
  const isMobile = useIsMobile();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.hours <= 0 && timeLeft.minutes <= 0 && timeLeft.seconds <= 0) {
    return null;
  }

  // Format numbers to always have two digits
  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`flex flex-col items-center ${containerClassName}`}>
      {/* Black bar with eye icon, message, and countdown */}
      <div className="w-full bg-black py-3 px-4 flex justify-center items-center space-x-4">
        <Eye className="text-white h-5 w-5 mr-2" />
        <div className="text-white text-sm md:text-base font-medium">
          {message}
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex flex-col items-center">
            <span className="text-white text-lg md:text-2xl lg:text-3xl font-bold">{formatNumber(timeLeft.hours)}</span>
            <span className="text-white text-[8px] md:text-xs uppercase">HORAS</span>
          </div>
          <span className="text-white text-lg md:text-2xl lg:text-3xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="text-white text-lg md:text-2xl lg:text-3xl font-bold">{formatNumber(timeLeft.minutes)}</span>
            <span className="text-white text-[8px] md:text-xs uppercase">MIN</span>
          </div>
          <span className="text-white text-lg md:text-2xl lg:text-3xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="text-white text-lg md:text-2xl lg:text-3xl font-bold">{formatNumber(timeLeft.seconds)}</span>
            <span className="text-white text-[8px] md:text-xs uppercase">SEG</span>
          </div>
        </div>
      </div>

      {/* Banner image below the countdown */}
      {bannerImageUrl && (
        <div 
          className="w-full flex items-center justify-center mt-0" 
          style={{ 
            backgroundImage: `url(${bannerImageUrl})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            height: isMobile ? '180px' : '220px',
            maxWidth: '100%'
          }}
        />
      )}
    </div>
  );
};
