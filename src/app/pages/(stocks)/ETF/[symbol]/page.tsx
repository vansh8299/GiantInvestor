"use client"

import { useParams } from 'next/navigation';
import React from 'react'

const ETF = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { symbol } = useParams();
  return (
    <div>ETF</div>
  )
}

export default ETF