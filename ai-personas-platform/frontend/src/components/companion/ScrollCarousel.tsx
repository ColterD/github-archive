'use client'; // For Next JS 13 app router


import React from 'react';
import ScrollCarousel from 'scroll-carousel-react';
import ModeButton from './ModeButton';

interface ScrollCarouselComponentProps {
    data: any;
    directio?: "ltr" | "rtl" | undefined;
  }

const ScrollCarouselComponent: React.FC<ScrollCarouselComponentProps> = ({ data, directio }) => {
  return (
    <ScrollCarousel
      autoplay
      autoplaySpeed={1}
      margin={50}
    //   speed={0}
      direction={directio ? directio : 'ltr'}
    >
      {data.map((item:any, index:number ) => (
        <ModeButton key={index} title={item.title} icon={item.icon} />
      ))}
    </ScrollCarousel>
  );
};

export default ScrollCarouselComponent;

