import { apis } from "../api"
import { consts } from "./consts"
import { IFont } from "./datatype"

const dom = document.createElement('style')
document.head.appendChild(dom)

const installed: { [i: string]: string } = {}


export function installFont(font: IFont) {
	installed[font.id] = font.file
	dom.innerHTML = Object.keys(installed).map(id => `@font-face{font-family: font_${id};src: url('${consts.apiURL}/${installed[id]}');}`).join('\n')
}

export async function installFontAll() {
	const fonts: Array<IFont> = await apis.font.list({})
	fonts.forEach(font => installFont(font))
	//更新到桌面歌词
	nativeApi.lyric.dlyricConfig('fonts', fonts.map(font => ({ id: font.id, url: `${consts.apiURL}/${font.file}` })))
	return fonts
}