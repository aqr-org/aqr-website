import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';
import React from 'react';
import Youtube from './Youtube';
import Audio from './Audio';
import Image from './Image';
import Flex from './Flex';

interface RichTextProps {
  blok: {
    content: string;
  }
}

export default function RichText({ blok }: RichTextProps) {
  return (
    <div {...storyblokEditable(blok)} className="rich-text prose">
      {render(blok.content, {
        blokResolvers: {
          youtube: (props: any) => <Youtube blok={props} />,
          audio: (props: any) => <Audio blok={props} />,
          image: (props: any) => <Image blok={props} />,
          flex: (props: any) => <Flex blok={props} />,
        },
        nodeResolvers: {
          table: (children: React.ReactNode) => {
            // Check if children already include tbody
            const childrenArray = React.Children.toArray(children);
            const hasTbody = childrenArray.some(
              (child: any) => 
                child?.type === 'tbody' || 
                (typeof child === 'object' && child?.props?.tag === 'tbody')
            );
            
            // If no tbody exists, wrap all direct tr elements in tbody
            if (!hasTbody) {
              return (
                <table>
                  <tbody>
                    {children}
                  </tbody>
                </table>
              );
            }
            
            return <table>{children}</table>;
          },
        },
      })}
    </div>
  )
}