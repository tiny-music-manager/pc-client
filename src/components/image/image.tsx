import './index.scss'
import { consts, colorDict } from "../../libs/consts"

interface IImageProps extends React.HTMLAttributes<any> {
	type?: 'api' | 'local' | 'web'
	src: string | null | undefined
	string?: string
}

export function Image(props: IImageProps) {
	let { src, string, type, style, className, ...rest } = props

	src = src ? ((src: string) => {
		if (/^data:/.test(src)) return src
		if (!/^https?:\/\//.test(src)) {
			if (type == 'api') return `${consts.apiURL}/${src.replace(/^\/+/, '')}`
			else if (type == 'local') return `${consts.localURL}/${src.replace(/^\/+/, '')}`
			else if (type == 'web') return null
			else return `${consts.apiURL}/${src.replace(/^\/+/, '')}`
		}
		return src
	})(src) : null

	let backgroundImage = `url(${src})`
	let color = 'currentColor'
	if (!src) {
		const ch = string?.substr(0, 1)
		const chc = ch?.charCodeAt(0) ?? 0
		const ci = chc % colorDict.length
		backgroundImage = `linear-gradient(to right, ${colorDict[ci][0]}, ${colorDict[ci][1]})`
		color = '#fff'
	}

	return (
		<div
			{...rest}
			style={{ backgroundImage, color, ...style }}
			className={`image-comp ${className ?? ''}`}
		>
			{src ? '' : string?.substr(0, 1)}
		</div>
	)
}