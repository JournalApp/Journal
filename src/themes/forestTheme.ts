import { alphaToHex } from 'utils'
import beginningImage from '../../assets/images/beginning-forest@2x.png'

const forestPalette = {
  neutral: {
    '0': '16, 25, 20',
    '10': '54, 69, 60', // popper
    '15': '57, 76, 65', // hover, inverted, toggle group bg
    '20': '68, 89, 77', // hover on inverted, border
    '25': '45, 55, 49', // bg
    '30': '54, 75, 63', // secondary surface
    '35': '68, 89, 77', // secondary hover
    '40': '127, 151, 138', // Not active toggle in Appearance toolbar
    '100': '221, 236, 207', // text
  },
  green: {
    '100': '88, 216, 88',
  },
  red: {
    '100': '255, 91, 91',
  },
  highlight: {
    main: '44, 104, 68',
    surface: '209, 255, 110',
  },
  tags: {
    pink: '240, 91, 202',
    green: '16, 170, 153',
    orange: '255, 123, 73',
    yellow: '255, 204, 94',
    blue: '65, 170, 235',
    violet: '192, 138, 223',
    lime: '132, 221, 90',
    red: '255, 83, 93',
    brown: '147, 87, 58',
    navy: '86, 103, 218',
  },
  products: {
    free: '74, 74, 74',
    writer: '71, 84, 65',
  },
}

const forestTheme = {
  color: {
    pure: forestPalette.neutral[0],
    primary: {
      // base colors
      main: forestPalette.neutral[100],
      surface: forestPalette.neutral[25],
      hover: forestPalette.neutral[30],
      border: forestPalette.neutral[30],
    },
    secondary: {
      // base colors
      main: forestPalette.neutral[100],
      surface: forestPalette.neutral[30],
      // colors for states
      hover: forestPalette.neutral[35],
    },
    popper: {
      // base colors
      pure: forestPalette.neutral[25],
      main: forestPalette.neutral[100],
      inverted: forestPalette.neutral[15],
      border: forestPalette.neutral[20],
      surface: forestPalette.neutral[10],

      // colors for states
      active: forestPalette.neutral[20],
      hover: forestPalette.neutral[15],
      hoverInverted: forestPalette.neutral[20],
      disabled: forestPalette.neutral[40],
      input: forestPalette.neutral[40],
    },
    success: {
      main: forestPalette.green[100],
    },
    error: {
      main: forestPalette.red[100],
    },
    highlight: {
      main: forestPalette.highlight['main'],
      surface: forestPalette.highlight['surface'],
      blendMode: 'normal',
    },
    tags: {
      pink: forestPalette.tags['pink'],
      green: forestPalette.tags['green'],
      orange: forestPalette.tags['orange'],
      yellow: forestPalette.tags['yellow'],
      blue: forestPalette.tags['blue'],
      violet: forestPalette.tags['violet'],
      lime: forestPalette.tags['lime'],
      red: forestPalette.tags['red'],
      brown: forestPalette.tags['brown'],
      navy: forestPalette.tags['navy'],
    },
    code: {
      main: '255, 126, 86',
      surface: forestPalette.neutral[100],
    },
    productFree: {
      main: forestPalette.neutral[100],
      surface: forestPalette.neutral[15],
      popper: forestPalette.neutral[25],
    },
    productWriter: {
      main: '215, 243, 170',
      surface: '70, 85, 64',
      popper: '62, 73, 56',
    },
  },
  style: {
    shadow: `0px 0px 0px 4px rgba(${forestPalette.neutral[25]})`,
    beginningImage: `url("${beginningImage}")`,
    handStriketrough:
      'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjYiIGhlaWdodD0iMjEiIHZpZXdCb3g9IjAgMCA2NiAyMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggb3BhY2l0eT0iMC41IiBkPSJNMiAxMy4zNjIxQzMuNjI0OTIgMTAuNTg3NSA1LjE2NDUyIDcuNzcwMzkgNi43NDM2NiA0Ljk3MzA1QzcuMDk1NyA0LjM0OTQ1IDcuNDkwNzkgMy43ODA1NSA3LjcyNTEgMy4xMDM2M0M3Ljk3NjU3IDIuMzc3MTkgOC4wOTg5OSAyLjg1ODQ3IDguMDk4OTkgMy4zNjA2OEM4LjA5ODk5IDQuODc5NTggOC4wOTg5OSA2LjM5ODQ5IDguMDk4OTkgNy45MTczOUM4LjA5ODk5IDkuODc3NjYgNy44ODg2OCAxMS44MjEyIDcuODg4NjggMTMuNzgyN0M3Ljg4ODY4IDE0LjMwNzQgNy41NzQwNSAxNS45Njg0IDcuOTkzODMgMTYuMzg4MkM4LjExMTUgMTYuNTA1OSA4LjQ5MTQ4IDE0Ljg5MzIgOC41MTk2MSAxNC43MTc0QzguNzQ4OTQgMTMuMjg0MSA5LjQ0MDg1IDExLjc4MDkgOS45NDUwNCAxMC40MTc3QzEwLjg0MzcgNy45ODgxMSAxMi4wMTc1IDUuNjgzNDkgMTIuOTgyOSAzLjMxMzk0QzEzLjA1MyAzLjE0MTg1IDEzLjU0NTkgMi4zMjM1IDEzLjU2NyAyLjg5MzMyQzEzLjYzNDggNC43MjE2NyAxMy42MDIgNi41ODY2NiAxMy40NjE5IDguNDA4MTJDMTMuMjgwNyAxMC43NjMyIDEzLjMwNTMgMTMuMTMyOCAxMy4xNTgxIDE1LjQ4ODZDMTMuMDk4MSAxNi40NDg5IDEyLjk0ODMgMTcuNzU3NiAxMy4xNTgxIDE4LjcwMTZDMTMuMzM1NyAxOS41MDA4IDE0LjQxODYgMTcuMTUzMyAxNC40MzE3IDE3LjEyNDNDMTUuNTM1OSAxNC42NzA1IDE2LjYwMzIgMTIuMjEwNCAxNy41NjI5IDkuNjkzMzRDMTguMjE3MiA3Ljk3NzUxIDE4Ljg2NTMgNi4yNjc1NSAxOS40NTU3IDQuNTI5MDdDMTkuNTE3NCA0LjM0NzQgMjAuMDgzNyAyLjcwMDA5IDIwLjI5NyAyLjk0MDA2QzIwLjk0ODMgMy42NzI3NyAyMC41MDczIDYuMDQ2NTUgMjAuNTA3MyA2LjkzNTk1QzIwLjUwNzMgOC45NjkzNiAyMC4yOTcgMTAuOTc5IDIwLjI5NyAxMy4wMTE2QzIwLjI5NyAxMy4xNzYyIDIwLjE3ODYgMTQuNjAwNiAyMC40MTM4IDE0LjYwMDZDMjEuMDg2OCAxNC42MDA2IDIyLjIzMTEgMTIuMDMxMyAyMi41MDUyIDExLjU3NDVDMjMuNTcwMiA5Ljc5OTUgMjQuNjA2NiA4LjAyMDU3IDI1LjY0ODIgNi4yMzQ5MUMyNi4xNzcgNS4zMjg0MSAyNi41NzMxIDQuMDU1ODcgMjcuMjM3MiAzLjI2NzIxQzI3LjYxNDcgMi44MTg4NyAyNy42NTc4IDIuODAyNDUgMjcuNjU3OCAzLjQ3NzUyQzI3LjY1NzggNS4wMDQwNSAyNy42NzExIDYuNTMxMTYgMjcuNjU3OCA4LjA1NzZDMjcuNjI5IDExLjM3MjUgMjYuMzk2IDE0LjU4NjggMjYuMzk2IDE3Ljg4MzdDMjYuMzk2IDE4LjI0NzYgMjcuMzQzIDE2LjQxNjEgMjcuNDU5MiAxNi4xNjYyQzI4LjQyNTUgMTQuMDg4NiAyOS42NDE0IDEyLjEzMDkgMzAuNzA3MyAxMC4xMDIzQzMxLjY3NjQgOC4yNTc5MSAzMi43MTc2IDYuMzQzNTIgMzMuOTQzNyA0LjY1NzU5QzM0LjMxNTggNC4xNDU5OCAzNC44MTU5IDIuOTM5NjkgMzUuNDM5MyAyLjY4MzAxQzM1LjczNDcgMi41NjEzNiAzNS42NTIxIDQuOTk5NSAzNS42NDk2IDUuMjA2NzNDMzUuNjI1IDcuMjIwNjQgMzUuMTc0NyA5LjIzODEgMzQuODA4NCAxMS4yMTIyQzM0LjU3MzUgMTIuNDc3OCAzNC4yMjIgMTMuODAwMSAzNC4xNzc0IDE1LjA5MTNDMzQuMTQ2NSAxNS45ODgyIDM0LjM1MDggMTUuODAwOCAzNC44MiAxNS4xMjY0QzM3LjI2ODkgMTEuNjA2MiAzOS40NTExIDcuODc2NTMgNDEuOTcwNiA0LjQxMjIzQzQyLjc3MzUgMy4zMDgyNSA0NC41Nzg2IDAuNDM3NjA5IDQ0LjIyNTYgMy41NzA5OUM0My44MDQ4IDcuMzA1NDMgNDIuMjk1OSAxMC42ODM2IDQxLjcwMTkgMTQuMzY2OUM0MS42NTM4IDE0LjY2NDkgNDEuMDQyMyAxNS45NjQyIDQxLjM3NDcgMTYuMjU5N0M0MS44NTcxIDE2LjY4ODUgNDMuMzMyOSAxNC4wMzU0IDQzLjQ1NDQgMTMuODY0NUM0NS44ODI0IDEwLjQ1MDEgNDcuNTg3NyA2LjYyMDA5IDQ5LjgyMjIgMy4wOTE5NUM1MC4wMTgzIDIuNzgyMjcgNTAuMzUwNCAxLjg2NDE4IDUwLjg4NTQgMi4wMTcwM0M1MS4yNDQxIDIuMTE5NTMgNTEuMDA1MSA1LjI3Mzk0IDUxLjAwMjIgNS41ODA2MkM1MC45NjcyIDkuMjU5MiA1MC4xNjEgMTIuODc5MSA1MC4xNjEgMTYuNTYzNUM1MC4xNjEgMTYuNjYwNiA1MC4wNzA1IDE3Ljk2OTIgNTAuMzcxMyAxNy42ODUxQzUxLjQ1NDYgMTYuNjYyIDUyLjExODYgMTQuODUzNSA1Mi43ODk5IDEzLjU2MDdDNTMuNzYyMSAxMS42ODgzIDU0LjY4NjYgOS44MDIyOSA1NS42MjkgNy45MTczOUM1Ni4xMjEyIDYuOTMzMDEgNTYuNTg1OCA1LjU4MDQ5IDU3LjMxMTUgNC43NTEwNkM1OC45MDE5IDIuOTMzNDYgNTguMzYzMSA3LjE2ODc5IDU4LjM2MzEgOC4xMDQzNEM1OC4zNjMxIDEwLjI5NzMgNTcuOTQyNSAxMi40NTU1IDU3Ljk0MjUgMTQuNjIzOUM1Ny45NDI1IDE1LjQ1MzEgNTguNzA2MiAxNC4xMzkxIDU4LjgzMDQgMTMuODk5NUM1OS43Njg4IDEyLjA4OTkgNjAuNjIyNiAxMC4yMjI2IDYxLjYxMTIgOC40NDMxN0M2Mi4yODU5IDcuMjI4NjMgNjIuNjk5MyA1LjY1NjU2IDYzLjUyNzQgNC41NTI0M0M2NC40Mzc0IDMuMzM5MSA2NC40NjIxIDMuOTI3MTMgNjQuNDYyMSA1LjA2NjUyQzY0LjQ2MjEgNy4xNTM3MyA2My44MzExIDkuMTgwMDggNjMuODMxMSAxMS4yNTkiIHN0cm9rZT0iI0QxRkY2RSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==)',
  },
}

export { forestTheme }
