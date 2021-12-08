import './index.scss'
import { Page } from "../../libs/page"
import { ChromePicker } from 'react-color'
import React from 'react'
import { IFont, IUConfig } from '../../libs/datatype'
import { apis } from '../../api'

interface ISettingPageState {
	fonts: Array<IFont>
	//系统设置
	systemTheme: 'auto' | 'dark' | 'light'
	systemColor: string
	systemFont: string
	//歌词设置
	lyricAlign: IUConfig['lyric']['align']
	lyricColor: IUConfig['lyric']['color']
	lyricColorPicker: 'play1' | 'play2' | 'wait1' | 'wait2' | null
	lyricFont: string
	lyricFontSize: number
	lyricFontBold: boolean
	//网络地址
	netaddr1: string
	netaddr2: string
	netaddr3: string
}

interface ICheckBoxRadioProps {
	label?: string
	className?: string
	checked?: boolean
	onChange?: (checked: boolean) => any
}

interface ISelectProps {
	className?: string
	items?: Array<{ key: string, label: string }>
	style?: React.CSSProperties
	selected?: Array<string>
	onChange?: (selected: Array<string>) => any
}


const fontSizes: Array<number> = []
for (let i = 20; i <= 40; ++i) {
	fontSizes.push(i)
}

const systemColors = [
	{ name: 'green', color: '#4caf50' },
	{ name: 'red', color: '#f44336' },
	{ name: 'blue', color: '#2196f3' },
	{ name: 'purple', color: '#9c27b0' },
	{ name: 'magenta', color: '#e91e63' },
	{ name: 'darkblue', color: '#3f51b5' },
	{ name: 'orange', color: '#ff9800' },
	{ name: 'brown', color: '#795548' },
]

function CheckBox(props?: ICheckBoxRadioProps) {
	return (
		<div className={`setting-checkbox-radio ${props?.checked ? 'checked' : ''} ${props?.className ?? ''}`}>
			<div className="checkbox-radio-icon is-checkbox" onClick={() => props?.onChange?.(!props?.checked)}>
				<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
					<path d="M455.42 731.04c-8.85 0-17.75-3.05-24.99-9.27L235.14 553.91c-16.06-13.81-17.89-38.03-4.09-54.09 13.81-16.06 38.03-17.89 54.09-4.09l195.29 167.86c16.06 13.81 17.89 38.03 4.09 54.09-7.58 8.83-18.31 13.36-29.1 13.36z"></path>
					<path d="M469.89 731.04c-8.51 0-17.07-2.82-24.18-8.6-16.43-13.37-18.92-37.53-5.55-53.96L734.1 307.11c13.37-16.44 37.53-18.92 53.96-5.55 16.43 13.37 18.92 37.53 5.55 53.96L499.67 716.89c-7.58 9.31-18.64 14.15-29.78 14.15z"></path>
				</svg>
			</div>
			<span className="checkbox-radio-label" onClick={() => props?.onChange?.(!props?.checked)}>{props?.label}</span>
		</div>
	)
}

function Radio(props?: ICheckBoxRadioProps) {
	return (
		<div className={`setting-checkbox-radio ${props?.checked ? 'checked' : ''} ${props?.className ?? ''}`}>
			<div className="checkbox-radio-icon is-radio" onClick={() => props?.onChange?.(!props?.checked)}><div></div></div>
			<span className="checkbox-radio-label" onClick={() => props?.onChange?.(!props?.checked)}>{props?.label}</span>
		</div>
	)
}

class Select extends React.Component<ISelectProps, { showOptions: boolean }> {
	private ref = React.createRef<HTMLDivElement>()

	constructor(props: any) {
		super(props)
		this.state = { showOptions: false }
		this.handleMouseDown = this.handleMouseDown.bind(this)
	}

	componentDidMount() {
		window.addEventListener('click', this.handleMouseDown)
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleMouseDown)
	}

	private handleMouseDown(e: MouseEvent) {
		if (!this.ref.current) return
		const path = ((e as any).path) as Array<HTMLElement>
		if (!path.includes(this.ref.current)) this.setState({ showOptions: false })
		else this.setState({ showOptions: true })
	}

	render() {
		const { showOptions } = this.state
		const { className, style, items, selected, onChange } = this.props
		return (
			<div className={`setting-select ${className ?? ''}`} style={style} ref={this.ref}>
				<div className="select-box">
					<div>{items?.filter(item => selected?.includes(item.key))?.map(item => item.label)?.[0] ?? '请选择'}</div>
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" className={`${showOptions ? 'show-options' : ''}`}>
						<path d="M512.726547 675.318646c-8.063653 0-15.790638-3.245927-21.435195-9.006118L231.175103 400.906809c-11.603269-11.837606-11.410887-30.840402 0.427742-42.442648 11.837606-11.601222 30.841426-11.410887 42.442648 0.427742l238.681054 243.534596L751.407602 358.891903c11.601222-11.839653 30.602995-12.033058 42.442648-0.427742 11.839653 11.603269 12.031011 30.605042 0.427742 42.442648L534.161742 666.312528C528.517185 672.072719 520.791224 675.318646 512.726547 675.318646z"></path>
					</svg>
				</div>
				{items?.length ? <div className="option-list" style={{ display: showOptions ? '' : 'none' }}>
					{items.map(item => <div
						key={item.key}
						className={`${selected?.includes(item.key) ? 'selected' : ''}`}
						onClick={e => {
							this.setState({ showOptions: false })
							e.stopPropagation()
							if (!onChange) return
							onChange([item.key])
						}}
					>{item.label}</div>)}
				</div> : null}
			</div>
		)
	}
}

export class SettingPage extends Page<{}, ISettingPageState> {

	private currentNetwork: string

	constructor(props: any) {
		super(props)
		const lyricConfig = nativeApi.appdata.getLyricConfig()
		const systemConfig = nativeApi.appdata.getSystemConfig()
		const addrConfig = nativeApi.appdata.getNetworkAddress()

		this.state = {
			fonts: [],

			systemTheme: systemConfig.theme ?? 'auto',
			systemColor: systemConfig.color ?? 'green',
			systemFont: systemConfig.font ?? '',

			lyricAlign: lyricConfig?.align ?? 'left-right',
			lyricColor: lyricConfig?.color ?? { play: ['#000', '#000'], wait: ['#000', '#000'] },
			lyricColorPicker: null,
			lyricFont: lyricConfig?.font.id ?? '',
			lyricFontSize: lyricConfig?.font.size ?? 30,
			lyricFontBold: lyricConfig?.font.bold ?? false,

			netaddr1: addrConfig?.addresses[0] || '',
			netaddr2: addrConfig?.addresses[1] || '',
			netaddr3: addrConfig?.addresses[2] || '',
		}

		this.saveSystemConfig = this.saveSystemConfig.bind(this)
		this.saveLyricConfig = this.saveLyricConfig.bind(this)
		this.currentNetwork = addrConfig?.current ?? ''
	}

	async componentDidMount() {
		const fonts = await apis.font.list({})
		this.setState({ fonts: [{ id: '', name: '系统默认', url: '' }, ...fonts] })

		window.addEventListener('click', () => {
			this.setState({ lyricColorPicker: null })
		})
	}

	private saveLyricConfig() {
		nativeApi.appdata.setLyricConfig({
			align: this.state.lyricAlign,
			color: this.state.lyricColor,
			font: { id: this.state.lyricFont, size: this.state.lyricFontSize, bold: this.state.lyricFontBold },
		})
	}

	private saveSystemConfig() {
		nativeApi.appdata.setSystemConfig({
			theme: this.state.systemTheme,
			color: this.state.systemColor,
			font: this.state.systemFont,
		})
	}

	private saveNetAddr() {
		const addresses = [this.state.netaddr1, this.state.netaddr2, this.state.netaddr3]
			.filter(addr => {
				if (!addr) return false
				if (!/^https?:\/\/\S+$/.test(addr)) return false
				return true
			})
		nativeApi.appdata.setNetworkAddress({ current: this.currentNetwork || addresses[0] || '', addresses })
	}

	render() {
		const {
			fonts = [],
			systemTheme, systemFont, systemColor,
			lyricAlign, lyricColor, lyricColorPicker, lyricFont, lyricFontSize, lyricFontBold,
			netaddr1, netaddr2, netaddr3,
		} = this.state


		const lyricUColor = { backgroundImage: `linear-gradient(to bottom, ${lyricColor.wait[0]}, ${lyricColor.wait[1]})` }
		const lyricPColor = { backgroundImage: `linear-gradient(to bottom, ${lyricColor.play[0]}, ${lyricColor.play[1]})` }
		return (
			<div id="setting-page">
				<div className="page-title">设置</div>
				{/* 界面设置 */}
				<div className="setting-group">
					<div className="title">系统界面</div>
					{/* 主题 */}
					<div className="input-item">
						<div className="label">主题</div>
						<div className="input-area" style={{ width: 400 }}>
							<Radio label="跟随主题" checked={systemTheme == 'auto'} onChange={() => this.setState({ systemTheme: 'auto' }, this.saveSystemConfig)} />
							<Radio label="浅色模式" checked={systemTheme == 'light'} onChange={() => this.setState({ systemTheme: 'light' }, this.saveSystemConfig)} />
							<Radio label="深色模式" checked={systemTheme == 'dark'} onChange={() => this.setState({ systemTheme: 'dark' }, this.saveSystemConfig)} />
						</div>
					</div>
					{/* 配色 */}
					<div className="input-item">
						<div className="label">配色方案</div>
						<div className="input-area" style={{ width: '100%' }}>
							<div className="syscolor-selector">{systemColors.map(color => <div
								onClick={() => this.setState({ systemColor: color.name }, this.saveSystemConfig)}
								key={color.name}
								className={`color-item ${systemColor == color.name ? 'selected' : ''}`}
							><div style={{ backgroundColor: color.color }}></div></div>)}</div>
						</div>
					</div>
					{/* 字体 */}
					<div className="input-item">
						<div className="label">系统字体</div>
						<div className="input-area" style={{ width: 400 }}>
							<div>
								<Select
									items={fonts.map(font => ({ key: font.id, label: font.name }))}
									selected={[systemFont]}
									onChange={res => this.setState({ systemFont: res[0] }, this.saveSystemConfig)} />
							</div>
						</div>
					</div>

				</div>
				{/* 桌面歌词 */}
				<div className="setting-group">
					<div className="title">桌面歌词</div>
					{/* 对齐方式 */}
					<div className="input-item">
						<div className="label">对齐</div>
						<div className="input-area" style={{ width: 400 }}>
							<Radio label="居中" checked={lyricAlign == 'center'} onChange={() => this.setState({ lyricAlign: 'center' }, this.saveLyricConfig)} />
							<Radio label="左右" checked={lyricAlign == 'left-right'} onChange={() => this.setState({ lyricAlign: 'left-right' }, this.saveLyricConfig)} />
							<Radio label="单行" checked={lyricAlign == 'single-line'} onChange={() => this.setState({ lyricAlign: 'single-line' }, this.saveLyricConfig)} />
						</div>
					</div>
					{/* 歌词颜色 */}
					<div className="input-item">
						<div className="label">颜色</div>
						<div className="input-area" style={{ width: 400 }}>
							<div className="lyric-color-item">
								<div>已播放</div>
								<div className="color-selector" onClick={e => e.stopPropagation()}>
									<div className="preview" style={{ backgroundColor: lyricColor.play[0] }} onClick={e => this.setState({ lyricColorPicker: 'play1' })}></div>
									{lyricColorPicker == 'play1' ? <ChromePicker
										className="color-picker"
										color={lyricColor.play[0]}
										onChangeComplete={() => console.log('fff')}
										onChange={e => this.setState({ lyricColor: { ...lyricColor, play: [e.hex, lyricColor.play[1]] } }, this.saveLyricConfig)} /> : null}
								</div>
								<div className="color-selector" onClick={e => e.stopPropagation()}>
									<div className="preview" style={{ backgroundColor: lyricColor.play[1] }} onClick={e => this.setState({ lyricColorPicker: 'play2' })}></div>
									{lyricColorPicker == 'play2' ? <ChromePicker
										className="color-picker"
										color={lyricColor.play[1]}
										onChange={e => this.setState({ lyricColor: { ...lyricColor, play: [lyricColor.play[0], e.hex] } }, this.saveLyricConfig)} /> : null}
								</div>
							</div>
							<div className="lyric-color-item">
								<div>未播放</div>
								<div className="color-selector" onClick={e => e.stopPropagation()}>
									<div className="preview" style={{ backgroundColor: lyricColor.wait[0] }} onClick={e => this.setState({ lyricColorPicker: 'wait1' })}></div>
									{lyricColorPicker == 'wait1' ? <ChromePicker
										className="color-picker"
										color={lyricColor.wait[0]}
										onChange={e => this.setState({ lyricColor: { ...lyricColor, wait: [e.hex, lyricColor.wait[1]] } }, this.saveLyricConfig)} /> : null}
								</div>
								<div className="color-selector" onClick={e => e.stopPropagation()}>
									<div className="preview" style={{ backgroundColor: lyricColor.wait[1] }} onClick={e => this.setState({ lyricColorPicker: 'wait2' })}></div>
									{lyricColorPicker == 'wait2' ? <ChromePicker
										className="color-picker"
										color={lyricColor.wait[1]}
										onChange={e => this.setState({ lyricColor: { ...lyricColor, wait: [lyricColor.wait[0], e.hex] } }, this.saveLyricConfig)} /> : null}
								</div>
							</div>
						</div>
					</div>
					{/* 字体 */}
					<div className="input-item">
						<div className="label">字体</div>
						<div className="input-area" style={{ width: 600 }}>
							<div>
								<Select
									items={fonts.map(font => ({ key: font.id, label: font.name }))}
									selected={[lyricFont]}
									onChange={res => this.setState({ lyricFont: res[0] }, this.saveLyricConfig)} />
							</div>
							<div style={{ flex: .7 }}>
								<Select style={{ width: 80 }}
									items={fontSizes.map(size => ({ key: `${size}`, label: `${size}` }))}
									selected={[lyricFontSize + '']}
									onChange={res => this.setState({ lyricFontSize: parseInt(res[0]) }, this.saveLyricConfig)} />
							</div>
							<div>
								<CheckBox label="粗体" checked={lyricFontBold} onChange={e => this.setState({ lyricFontBold: e }, this.saveLyricConfig)} />
							</div>
						</div>
					</div>
					{/* 预览 */}
					<div className="input-item">
						<div className="label">预览</div>
						<div className="input-area" style={{ width: 800 }}>
							<div className={`lyric-preview ${lyricAlign}`} style={{
								fontFamily: `font_${lyricFont}`,
								fontSize: `${lyricFontSize}px`,
								fontWeight: lyricFontBold ? 'bold' : 'normal',
							}}>
								<div className="line line1">
									<div style={lyricUColor}>歌<div style={lyricPColor}>歌</div></div>
									<div style={lyricUColor}>词<div style={lyricPColor}>词</div></div>
									<div style={lyricUColor}>第<div style={{ ...lyricPColor, width: '50%' }}>第</div></div>
									<div style={lyricUColor}>一</div>
									<div style={lyricUColor}>行</div>
									<div style={lyricUColor}>ABCDEFG</div>
								</div>
								<div className="line line2">
									<div style={lyricUColor}>歌</div>
									<div style={lyricUColor}>词</div>
									<div style={lyricUColor}>第</div>
									<div style={lyricUColor}>二</div>
									<div style={lyricUColor}>行</div>
									<div style={lyricUColor}>HIJKLMN</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* 网络配置 */}
				<div className="setting-group">
					<div className="title">网络地址配置</div>
					<div className="input-item">
						<div className="label">当前地址</div>
						<div className="input-area" style={{ width: 400 }}>{this.currentNetwork}</div>
					</div>
					<div className="input-item">
						<div className="label">主网络地址</div>
						<div className="input-area" style={{ width: 400 }}>
							<input className="setting-input netaddr" value={netaddr1} onChange={e => this.setState({ netaddr1: e.target.value })} onBlur={this.saveNetAddr.bind(this)} />
						</div>
					</div>
					<div className="input-item">
						<div className="label">备用地址1</div>
						<div className="input-area" style={{ width: 400 }}>
							<input className="setting-input netaddr" value={netaddr2} onChange={e => this.setState({ netaddr2: e.target.value })} onBlur={this.saveNetAddr.bind(this)} />
						</div>
					</div>
					<div className="input-item">
						<div className="label">备用地址2</div>
						<div className="input-area" style={{ width: 400 }}>
							<input className="setting-input netaddr" value={netaddr3} onChange={e => this.setState({ netaddr3: e.target.value })} onBlur={this.saveNetAddr.bind(this)} />
						</div>
					</div>
				</div>
			</div>
		)
	}
}