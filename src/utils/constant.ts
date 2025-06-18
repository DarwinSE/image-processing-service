const imageFormat = ['jpg', 'jpeg', 'png', 'webp', 'jp2', 'jxl', 'avif'] as const

const losslessFormat = ['webp', 'avif', 'jxl', 'jp2'] as const

const objectFit = ['contain', 'cover', 'fill', 'inside', 'outside'] as const

const objectPosition = ['top', 'bottom', 'left', 'right', 'center', 'right top', 'right bottom', 'left top', 'left bottom'] as const

export { imageFormat, losslessFormat, objectFit, objectPosition }