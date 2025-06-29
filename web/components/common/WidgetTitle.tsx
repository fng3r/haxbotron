import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function WidgetTitle(props: Props) {
  return <h2 className="text-lg font-semibold text-primary mb-2">{props.children}</h2>;
}
