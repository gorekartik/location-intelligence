// we already used dynamic() in page.tsx while loading map component
// so actually this is not needed but to be extra safe we are keeping it
import dynamic from 'next/dynamic';
import React from 'react';

const NoSSR = (props: { children: React.ReactNode }) => (
    <React.Fragment>{props.children}</React.Fragment>
);

export default dynamic(() => Promise.resolve(NoSSR), {
    ssr: false
});
