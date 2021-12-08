import './upload.scss'
import React from "react"
import ss from 'string-similarity'
import { apis } from "../../api"
import { IKind } from "../../libs/datatype"
import { IMusicScannerResult, MusicScanner } from "../editor/music/scaner"
import { createDialog } from '../../components/popover'
import { Image } from '../../components/image/image'
import { KindSelector } from '../editor/kind/selector'
import { util } from '../../libs/util'
import { TMMComponent } from '../../libs/component'

export interface IUploadInfo {
	name: string						//名称
	singer: string						//歌手
	path: string,						//文件路径
	detail: IMusicScannerResult | null	//音乐信息
	kinds: Array<string> | null			//音乐分类
	duration: number					//时长
}

interface IMusicUploadManagePageState {
	uploads: Array<IUploadInfo>
	uploading: boolean
	kinds: Array<IKind>
}

interface ISameSingerWarnProps {
	upload: IUploadInfo			//上传信息
	singers: Array<any>			//服务器端的歌手列表
	result: { [i: string]: string }		//结果，歌手名称->本地歌手id
}

const Icons = {
	Edit: (props: React.SVGAttributes<SVGSVGElement>) => <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M652.4 156.6125a112.5 112.5 0 1 1 155.925 161.15625L731.375 394.71875 572.3 235.5875l79.5375-79.5375 0.5625 0.5625zM333.63125 792.40625v0.1125H174.5v-159.1875l358.03125-357.975 159.075 159.13125-357.975 357.91875zM62 849.5h900v112.5H62v-112.5z"></path>
	</svg>,
	Search: (props: React.SVGAttributes<SVGSVGElement>) => <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M469.333333 768c-166.4 0-298.666667-132.266667-298.666666-298.666667s132.266667-298.666667 298.666666-298.666666 298.666667 132.266667 298.666667 298.666666-132.266667 298.666667-298.666667 298.666667z m0-85.333333c119.466667 0 213.333333-93.866667 213.333334-213.333334s-93.866667-213.333333-213.333334-213.333333-213.333333 93.866667-213.333333 213.333333 93.866667 213.333333 213.333333 213.333334z m251.733334 0l119.466666 119.466666-59.733333 59.733334-119.466667-119.466667 59.733334-59.733333z"></path>
	</svg>,
	Remove: (props: React.SVGAttributes<SVGSVGElement>) => <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M256 810.666667c0 46.933333 38.4 85.333333 85.333333 85.333333h341.333334c46.933333 0 85.333333-38.4 85.333333-85.333333V298.666667H256v512z m105.173333-303.786667l60.373334-60.373333L512 536.96l90.453333-90.453333 60.373334 60.373333L572.373333 597.333333l90.453334 90.453334-60.373334 60.373333L512 657.706667l-90.453333 90.453333-60.373334-60.373333L451.626667 597.333333l-90.453334-90.453333zM661.333333 170.666667l-42.666666-42.666667H405.333333l-42.666666 42.666667h-149.333334v85.333333h597.333334V170.666667z"></path>
	</svg>,
	Warn: (props: React.SVGAttributes<SVGSVGElement>) => <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M512 179.2l390.4 627.2H128l384-627.2m0-64c-19.2 0-44.8 12.8-51.2 32l-390.4 627.2c-25.6 44.8 6.4 96 51.2 96H896c51.2 0 83.2-57.6 51.2-96l-384-627.2c-6.4-19.2-32-32-51.2-32z"></path>
		<path d="M512 640c-19.2 0-32-12.8-32-32v-192c0-19.2 12.8-32 32-32s32 12.8 32 32v192c0 19.2-12.8 32-32 32z"></path>
		<path d="M512 723.2m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"></path>
	</svg>,
	Upload: (props: React.SVGAttributes<SVGSVGElement>) => <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M864 832h-704a32 32 0 0 0 0 64h704a32 32 0 0 0 0-64zM222.72 478.08H384v238.72a34.56 34.56 0 0 0 33.92 34.56h192a34.56 34.56 0 0 0 30.08-34.56V478.08h160.64a30.08 30.08 0 0 0 21.76-51.84L533.76 136.96a30.72 30.72 0 0 0-43.52 0L200.96 426.24a30.08 30.08 0 0 0 21.76 51.84z"></path>
	</svg>
}

//相同歌手警告
export class SameSingerWarn extends React.Component<ISameSingerWarnProps> {
	render() {
		const { upload, singers, result } = this.props
		// console.log(upload, singers)
		return (
			<div>
				<div>《{upload.detail?.name ?? upload.name}》中，歌手已经存在了，是否进行覆盖？</div>
				<div>{upload.detail?.singers.map(singer => {
					const local = singers.filter(ri => ri.name == singer.name)
					if (!local.length) return null
					return <div className="replace-info" key={singer.name}>
						{/* 当前歌手 */}
						<div className="current">
							<div className="singer-item" title={singer.desc}>
								<Image className="avatar" src={singer.avatar} string={singer.name} />
								<div className="name">{singer.name}</div>
							</div>
						</div>
						{/* 替换图标 */}
						<div className="switch-icon">
							<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
								<path d="M277.461333 618.752l1.450667 0.085333H917.333333a21.333333 21.333333 0 0 1 20.992 17.536l0.341334 3.84v42.666667a21.333333 21.333333 0 0 1-21.333334 21.333333H298.794667v106.709334a21.333333 21.333333 0 0 1-38.4 12.8l-128-170.88a21.333333 21.333333 0 0 1 17.066666-34.133334h128z m529.066667-418.218667l128 170.88a21.333333 21.333333 0 0 1-17.066667 34.133334H149.333333a21.333333 21.333333 0 0 1-21.333333-21.333334v-42.666666a21.333333 21.333333 0 0 1 21.333333-21.333334h618.752V213.333333a21.333333 21.333333 0 0 1 38.4-12.8z"></path>
							</svg>
						</div>
						{/* 替换歌手 */}
						<div className="replaced">
							{local.map(li => <div
								className={`singer-item ${result[singer.name] == li.id ? 'active' : ''}`} key={li.id}
								onClick={() => {
									result[singer.name] = (result[singer.name] == li.id) ? undefined : li.id
									this.forceUpdate()
								}}
								title={li.desc || undefined}
							>
								<Image className="avatar" src={li.avatar} string={li.name} type='api' />
								<div className="name">{li.name}</div>
								<div className="similar">(相似度:{(() => {
									const str1 = `${singer.name}\n${singer.desc}\n${singer.birthday}`
									const str2 = `${li.name}\n${li.desc}\n${li.birthday}`
									return parseInt(ss.compareTwoStrings(str1, str2) * 100 as any)
								})()}%)</div>
							</div>)}
						</div>
					</div>
				})}</div>
			</div >
		)
	}
}

//音乐上传管理
export class MusicUploadManagePage extends TMMComponent<any, IMusicUploadManagePageState> {
	private uploading: { [i: string]: boolean } = {}		//上传中的内容

	private dragArea = React.createRef<HTMLDivElement>()

	constructor(props: any) {
		super(props)
		const uploads = nativeApi.appdata.getUploads()
		console.log(uploads)
		this.state = {
			uploads: uploads ?? [],
			kinds: [],
			uploading: false,
		}
	}

	//文件拖入操作
	private handleDragOver(e: DragEvent) {
		e.preventDefault()
		if (!this.dragArea.current) return
		//设置文本
		const path = (e as any).path as Array<HTMLElement>
		this.dragArea.current.innerHTML = (path.some(e => e == this.dragArea.current)) ? '可以松手了' : '拖到这里'
		//显示
		this.dragArea.current.style.display = ''
	}

	private handleDrop(e: DragEvent) {
		e.preventDefault()
		if (!this.dragArea.current) return
		this.dragArea.current.style.display = 'none'
		//检测拖入区域
		let top: HTMLElement | null = e.target as any
		while (true) {
			if (top == this.dragArea?.current || !top)
				break
			top = top.parentElement
		}
		if (!top) return
		//读取文件内容
		const files = e.dataTransfer?.files
		if (!files) return
		for (let i = 0; i < files.length; ++i) {
			const file = files[i]
			this.handleAddFile(file.path)
		}
	}

	private handleDragFinish(e: DragEvent) {
		const evt = e as any
		//fromElement==null时表示拖出了
		if (!(e as any).fromElement) {
			if (this.dragArea.current) this.dragArea.current.style.display = 'none'
		}
	}

	async componentDidMount() {
		// window.addEventListener('dragover', e => console.log(e))
		window.addEventListener('dragover', this.handleDragOver.bind(this))
		window.addEventListener('drop', this.handleDrop.bind(this))
		window.addEventListener('dragleave', this.handleDragFinish.bind(this))
		//加载分类
		const kinds = await apis.kind.list({})
		this.setState({ kinds })
	}

	componentWillUnmount() {
		window.removeEventListener('dragover', this.handleDragOver.bind(this))
		window.removeEventListener('drop', this.handleDrop.bind(this))
		window.removeEventListener('dragleave', this.handleDrop.bind(this))
	}

	/**
	 * 添加文件
	 * @param file 文件|目录
	 */
	private async handleAddFile(file: string) {
		if (nativeApi.fs.isdir(file)) {
			const files = nativeApi.fs.readdir(file)
			for (let i = 0; i < files.length; ++i) {
				await this.handleAddFile(nativeApi.path.join(file, files[i]))
			}
		}
		else if (['.mp3', '.flac', '.wav', '.ape'].includes(nativeApi.path.extname(file))) {
			//本地是否有
			const { uploads } = this.state
			if (uploads.some(u => u.path == file)) return

			//得到数据
			const fname = nativeApi.path.basename(file, nativeApi.path.extname(file))
			const match = fname.match(/^([^-]+)\s*?-\s*?([\s\S]+?)$/)
			const [singer, name] = match ? [match[1].trim(), match[2].trim()] : [fname, '']

			//获取时长
			const duration = await nativeApi.audio.duration(file)
			if (!duration) return

			//查询服务器
			const singers = singer.split(/[、,，]/).map(s => s.trim())
			const res = await apis.music.validate({ name, artists: singers, duration })
			if (res?.length) return

			//添加到上传列表
			uploads.push({
				name, singer,
				path: file,
				detail: null,
				kinds: null,
				duration: duration,
			})
			this.forceUpdate()
			this.saveUploads()
		}
	}

	//保存上传内容
	private saveUploads() {
		nativeApi.appdata.setUploads(this.state.uploads)
	}

	//类型选择
	private async handleSelectUploadMusicKinds(upload: IUploadInfo) {
		const result = await KindSelector.open({ selected: upload.kinds })
		if (!result) return
		upload.kinds = result
		this.saveUploads()
		this.forceUpdate()
	}

	//搜索歌曲
	private async handleSearchUploadMusic(upload: IUploadInfo) {
		const result = await MusicScanner.open({ info: upload })
		console.log(result)
		if (!result) return
		upload.singer = result.singers.map(singer => singer.name).join(',')
		upload.name = result.name
		upload.detail = result
		this.saveUploads()
		this.forceUpdate()
	}

	//删除上传音乐
	private async handleRemoveUploadMusic(upload: IUploadInfo) {
		if (!await createDialog('是否删除', `是否要删除歌曲《${upload.detail?.name ?? upload.name}》？`).wait()) return
		const { uploads } = this.state
		for (let i = 0; i < uploads.length; ++i) {
			if (uploads[i].path == upload.path) {
				uploads.splice(i, 1)
				this.saveUploads()
				this.forceUpdate()
				break;
			}
		}
	}

	//上传音乐
	private async handleUploadMusic(upload: IUploadInfo) {
		//此函数单独用于处理上传
		const doUpload = async () => {

			//检测服务器端是否存在
			const vres = await apis.music.validate({ name: upload.name, artists: upload.detail?.singers.map(s => s.name) ?? [], duration: upload.duration })

			//提出警告
			if (vres.length && !await createDialog('音乐已存在', `《${upload.name}》现已有${vres.length}首，是否继续上传？`).wait()) return

			//检测歌手是否存在
			const uploadSingers = [...upload.detail?.singers ?? [], ...upload.detail?.album?.artists ?? []].filter(s => !s.id)
			const sres: Array<any> = uploadSingers?.length ? await apis.artist.list({ names: upload.detail?.singers.map(s => s.name) }) : []

			//提出警告
			if (sres.length) {
				const singerResult: { [i: string]: string } = {}
				uploadSingers.forEach(singer => {
					if (singer.id) singerResult[singer.name] = singer.id
				})
				if (!await createDialog('歌手已存在', <SameSingerWarn upload={upload} singers={sres} result={singerResult} />).wait()) return
				//结果处理
				upload.detail?.singers?.forEach?.(s => s.id = singerResult[s.name] || undefined)
				upload.detail?.singers?.forEach?.(s => s.id = singerResult[s.name] || undefined)
			}

			//数据处理
			function resolveDate(date: string) {
				if (!date.trim()) return undefined
				const [y, m, d] = date.split(/-/g)
				return `${y.padStart(4, '19')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
			}

			//开始上传
			await apis.music.upload({
				name: upload.detail?.name ?? upload.name,
				artists: (upload.detail?.singers ?? []).map(singer => ({
					id: singer.id,
					name: singer.name,
					birthday: resolveDate(singer.birthday),
					desc: singer.desc,
					avatar: singer.avatar,
				})),
				album: upload.detail?.album ? {
					id: upload.detail?.album?.id,
					name: upload.detail?.album?.name,
					issue: upload.detail?.album?.issue,
					desc: upload.detail?.album?.desc,
					pic: upload.detail?.album?.pic,
					artists: upload.detail?.album?.artists?.map(artist => ({
						id: artist.id,
						name: artist.name,
						birthday: resolveDate(artist.birthday),
						desc: artist.desc,
						avatar: artist.avatar,
					}))
				} : undefined,
				types: upload.kinds ?? [],
				pic: upload.detail?.image,
			}, { music: upload.path })

			//从列表中删除
			const uploads = [...this.state.uploads]
			for (let i = 0; i < uploads.length; ++i) {
				if (uploads[i].path == upload.path) {
					uploads.splice(i, 1)
					break
				}
			}

			return uploads
		}
		//loading
		this.uploading[upload.path] = true
		this.forceUpdate()
		//上传
		const uploads = await doUpload()
		//更新
		delete this.uploading[upload.path]
		if (uploads) this.setState({ uploads }, () => this.saveUploads())
	}

	//全部上传
	private async handleUploadAll() {
		const uploads = this.uploadabled
		if (this.state.uploading || !uploads.length) return
		this.setState({ uploading: true })
		for (let i = 0; i < uploads.length; ++i) {
			await this.handleUploadMusic(uploads[i + 0])
		}
		this.setState({ uploading: false })
	}

	//通过kind的id，获取kind字符串
	private getKindsStr(kinds: Array<string> | null | undefined) {
		return kinds?.map(k => this.state.kinds.filter(dk => dk.id == k)?.[0]?.name).filter(s => !!s).join(',') ?? undefined
	}

	//获取可上传的
	private get uploadabled() {
		return [...this.state.uploads.filter(up => up.name && up.duration && up.path && up.detail && up.kinds?.length)]
	}

	render() {
		const { uploads, uploading } = this.state
		return (
			<div className="manage-upload">
				<div className="top-btns">
					{/* <div className="btn" onClick={() => {}}>选择音乐</div> */}
					<div className={`button ${(uploading || !this.uploadabled.length) ? 'disabled' : ''}`} onClick={this.handleUploadAll.bind(this)}>上传音乐</div>
					<div className={`button ${uploads.length ? '' : 'disabled'}`} style={{ marginLeft: 10 }} onClick={async () => {
						if (!uploads.length) return
						if (!await createDialog('清空列表', '是否清除上传列表中的所有项目?').wait()) return
						this.setState({ uploads: [] }, () => this.saveUploads())
					}}>全部清除</div>
				</div>
				<div className="content">
					<div className="music-line title">
						<div className="pic">封面</div>
						<div className="name">名称</div>
						<div className="artist">歌手</div>
						<div className="album">专辑</div>
						<div className="kind">分类</div>
						<div className="duration">时长</div>
						<div className="btns">操作</div>
					</div>
					<div className="music-list">
						{uploads.map(up => <div className="music-line" key={up.path}>
							<div className="pic">{up.detail?.image ? <div style={{ backgroundImage: `url(${up.detail.image})` }}></div> : ' '}</div>
							<div className="name" title={up.name}>{up.name}</div>
							<div className={`artist ${up.detail ? '' : 'warn-color'}`} title={up.singer}>{up.singer}</div>
							<div className="album" title={up.detail?.album?.name}>{up.detail ? up.detail.album?.name ?? '无' : <Icons.Warn className="warn-color" />}</div>
							<div className="kind">
								<span className={up.kinds?.length ? '' : 'warn-color'} title={this.getKindsStr(up.kinds)} onClick={() => this.handleSelectUploadMusicKinds(up)}>
									{this.getKindsStr(up.kinds) ?? '请选择'}
								</span>
							</div>
							<div className="duration">{util.durationStr(up.duration)}</div>
							{this.uploading[up.path]
								? <div className="btns" style={{ fontSize: '.8em' }}>上传中</div>
								: <div className="btns">
									<span title="从互联网搜寻" onClick={() => this.handleSearchUploadMusic(up)}><Icons.Search /></span>
									{/* <span title="修改" onClick={() => this.handleEditMusic(null!)}><Icons.Edit /></span> */}
									{/* <span title="上传" onClick={() => this.handleUploadMusic(up)}><Icons.Upload /></span> */}
									<span title="删除" onClick={() => this.handleRemoveUploadMusic(up)}><Icons.Remove /></span>
								</div>}
						</div>)}
					</div>
				</div>
				<div className="drag-area" ref={this.dragArea} style={{ display: 'none' }}></div>
			</div>
		)
	}
}