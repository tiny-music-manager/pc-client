import './font.scss'
import { TMMComponent } from "../../libs/component"
import { apis } from '../../api'
import { IFont } from '../../libs/datatype'
import { FontEditor } from '../editor/font/editor'
import { CheckBox } from '../../components/checkbox'
import { createDialog } from '../../components/popover'
import { installFontAll } from '../../libs/font-install'

interface IFontManagePageState {
	selected: string
	fonts: Array<IFont>
}

export class FontManagePage extends TMMComponent<{}, IFontManagePageState> {

	async componentDidMount() {
		this.loadFonts()
	}

	private async loadFonts() {
		const fonts = await installFontAll()
		this.setState({ fonts })
	}


	private get current(): IFont | null {
		return (this.state.fonts ?? []).filter(f => f.id == this.state.selected)?.[0] ?? null
	}

	private async handleEditFont(type: 'add' | 'edit') {
		if (type == 'edit' && !this.current) return
		const result = await FontEditor.open({ font: type == 'add' ? undefined : (this.current ?? undefined) })
		if (!result) return

		await apis.font.save({ id: result.id || undefined, name: result.name }, { font: result.ufile || undefined })
		this.loadFonts()
	}


	private async hadleRemoveFont() {
		const font = this.current
		if (!font) return
		if (!await createDialog(`删除字体`, `是否删除字体“${font.name}”？`).wait()) return

		await apis.font.remove({ id: font.id })
		this.loadFonts()
	}

	render() {
		const { fonts = [], selected = '' } = this.state
		return (
			<div className="manage-font">
				<div className="button-area">
					<div className="button" onClick={() => this.handleEditFont('add')}>上传字体</div>
					<div className={`button ${selected ? '' : ' disabled'}`} onClick={() => this.handleEditFont('edit')}>修改字体</div>
					<div className={`button ${selected ? '' : ' disabled'}`} onClick={() => this.hadleRemoveFont()}>删除字体</div>
				</div>
				<div className="body">
					<div className="font-line head">
						<div className="check"></div>
						<div className="name">名称</div>
						<div className="preview">预览</div>
					</div>
					<div className="font-container">
						{fonts.map(font => <div className="font-line" key={font.id} onClick={() => this.setState({ selected: selected == font.id ? '' : font.id })}>
							<div className="check">
								<CheckBox checked={selected == font.id} />
							</div>
							<div className="name"><div className="text">{font.name}</div></div>
							<div className="preview"><div className="text" style={{ fontFamily: `font_${font.id}` }}>这是一段用于预览的文字ABCDEFG</div></div>
						</div>)}
					</div>
				</div>
			</div>
		)
	}
}