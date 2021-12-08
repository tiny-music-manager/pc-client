import React, { SyntheticEvent } from "react"
import { Switch, Route } from 'react-router-dom'
import { apis } from "../../api"
import { AppbarButtons } from "../../components/appbar/btns"
import { Image } from "../../components/image/image"
import { i18n } from "../../i18n"
import { TMMComponent } from "../../libs/component"
import { history } from "../../libs/consts"
import { dataset } from "../../libs/dataset"
import { IUser } from "../../libs/datatype"
import { AlbumDetailPage, AlbumPage } from "../album"
import { ArtistDetailPage, ArtistPage } from "../artist"
import { LoginDialog } from "../editor/user/login"
import { KindDetailPage, KindPage } from "../kind"
import { LovePage } from "../love"
import { ManagePage } from "../manage"
import { PlaylistPage } from "../playlist"
import { RecommendPage } from "../recommend"
import { SettingPage } from "../setting"
import "./home.scss"
import { Player } from "./player"


interface IMainPageState { }

export class HomePage extends TMMComponent<{}, IMainPageState> {

	constructor(props:any) {
		super(props)
		this.handleGlobalResize = this.handleGlobalResize.bind(this)
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleGlobalResize)
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleGlobalResize)
	}

	//窗口大小改变时操作
	private handleGlobalResize() {
		this.forceUpdate()
	}

	//检测左侧的某个tab是不是处于active状态
	private activeClass(pathname: string) {
		// return (history.location.pathname.indexOf(pathname) == 0) ? 'actived' : ''
		return (history.location.pathname == pathname) ? 'actived' : ''
	}

	//处理搜索
	private handleSearch(evt: SyntheticEvent<HTMLFormElement>) {
		evt.preventDefault()
		const keyword = (evt.target as HTMLFormElement).keyword.value
		console.log(keyword, evt)
	}

	//去除全局菜单
	private handleGlobalContextMenu(evt: SyntheticEvent) {
		const tagName = ((evt.target as HTMLElement)?.tagName ?? '').toLowerCase()
		if (!['input', 'textarea'].includes(tagName)) evt.preventDefault()
	}

	private handleOpenMenu(e: React.MouseEvent) {
		//查找点击的div
		let div: HTMLDivElement | undefined = undefined
		for (let i = 0; i < (e.nativeEvent as any).path.length; ++i) {
			if ((e.nativeEvent as any).path[i] instanceof HTMLDivElement) {
				div = (e.nativeEvent as any).path[i]
				break
			}
		}
		if (!div) return
		e.stopPropagation()
		//显示菜单
		this.menu([
			{ key: 'setting', label: i18n.home.title.menu.setting.string, onClick: () => history.push('/setting') },
			...dataset.user?.admin ? [{ key: 'control', label: i18n.home.title.menu.control.string, onClick: () => history.push('/manage') }] : [],
			'div',
			{ key: 'help', label: i18n.home.title.menu.about.string },
			{ key: 'about', label: i18n.home.title.menu.help.string },
			{ key: 'exit', label: i18n.home.title.menu.exit.string, onClick: () => nativeApi.window.closeWindow(undefined) },
		]).showCustom(opt => {
			const divRct = div!.getBoundingClientRect()
			const rct = opt.dom.getBoundingClientRect()
			let x = divRct.left + (divRct.width - rct.width) / 2
			let y = divRct.bottom + 2
			return { x, y }
		})
	}

	public render() {

		return (
			<div className="MainPage" onContextMenu={this.handleGlobalContextMenu.bind(this)}>
				<div className="left">
					<div className="logo">
						<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
							<path d="M983.38 306.44l-442.628 81.458a17.454 17.454 0 0 0-14.302 17.162v375.822c-31.38-18.59-72.608-24.724-113.914-13.666-74.146 19.85-120.418 87.528-103.352 151.164s91.006 99.13 165.152 79.28c65.884-17.638 109.718-73.042 106.704-129.814h0.188V469.482l367.992-67.74v289.742c-31.38-18.59-72.61-24.724-113.914-13.666-74.146 19.85-120.418 87.528-103.352 151.164 17.066 63.636 91.006 99.13 165.152 79.28 64.794-17.348 108.296-71.218 106.852-126.998H1004l0.008-457.66c0.002-10.906-9.896-19.14-20.628-17.164z" fill="#707AFA"></path>
							<path d="M474.336 977.676c-74.146 19.85-148.086-15.644-165.152-79.28a103.588 103.588 0 0 1-3.038-16.91c-1.166 12.202-0.254 24.62 3.038 36.894 17.066 63.636 91.006 99.13 165.152 79.28 65.884-17.638 109.718-73.042 106.704-129.814h0.188v-19.984h-0.188c3.014 56.774-40.82 112.176-106.704 129.814zM1004 761.28h-0.042c1.444 55.78-42.058 109.652-106.852 126.998-74.146 19.85-148.086-15.644-165.152-79.28a103.588 103.588 0 0 1-3.038-16.91c-1.166 12.202-0.254 24.62 3.038 36.894 17.066 63.636 91.006 99.13 165.152 79.28 64.794-17.348 108.296-71.218 106.852-126.998H1004l0.008-457.66v-0.006L1004 761.28z" fill="#6770E6"></path>
							<path d="M487.55 167.318c-30.86-99.616-129.14-131.888-191.96-142.34-15.806-2.62-31.02-3.864-41.386-4.454a12.668 12.668 0 0 0-13.394 12.65v378.478c-31.38-18.59-72.61-24.726-113.916-13.668-74.146 19.85-120.418 87.528-103.352 151.164 17.066 63.636 91.006 99.13 165.152 79.28 65.884-17.638 109.716-73.042 106.704-129.814h0.192V150.392c35.96 2.658 84.72 19.644 130.94 79.312 67.62 87.246 154.7 51.036 154.7 51.036-39.7 0.002-75.24-53.872-93.68-113.422z" fill="#FF8354"></path>
							<path d="M188.692 607.944c-74.146 19.85-148.086-15.644-165.152-79.28a103.55 103.55 0 0 1-3.008-16.66c-1.204 12.282-0.306 24.79 3.008 37.146 17.066 63.636 91.006 99.13 165.152 79.28 65.884-17.638 109.716-73.042 106.704-129.814h0.192v-20.486h-0.192c3.014 56.774-40.82 112.176-106.704 129.814z" fill="#E0734A"></path>
							<path d="M126.894 437.954c41.306-11.058 82.536-4.924 113.916 13.668v-39.966c-31.38-18.59-72.61-24.726-113.916-13.668-71.43 19.122-116.964 82.634-104.95 144.156 9.03-47.094 49.064-89.228 104.95-104.19z" fill="#FFAC8C"></path>
							<path d="M540.752 427.864l442.628-81.456c10.728-1.974 20.62 6.252 20.628 17.148v-39.952c0-10.904-9.896-19.138-20.628-17.162l-442.628 81.456a17.456 17.456 0 0 0-14.302 17.162v39.966a17.454 17.454 0 0 1 14.302-17.162zM835.308 717.784c41.306-11.058 82.534-4.924 113.914 13.666v-39.966c-31.38-18.59-72.61-24.724-113.914-13.666-71.43 19.124-116.964 82.634-104.95 144.156 9.03-47.094 49.064-89.228 104.95-104.19zM412.536 807.182c41.304-11.058 82.532-4.924 113.914 13.666v-39.966c-31.38-18.59-72.608-24.724-113.914-13.666-71.43 19.124-116.964 82.634-104.948 144.156 9.03-47.092 49.064-89.228 104.948-104.19z" fill="#8F95E6"></path>
							<path d="M244.204 54.496c10.366 0.59 25.582 1.834 41.386 4.454 62.82 10.452 161.1 42.724 191.96 142.34 10.292 33.238 25.916 64.698 44.612 86.018 33.838 3.914 59.066-6.566 59.066-6.566-39.7 0-75.24-53.874-93.68-113.424-30.86-99.616-129.14-131.888-191.96-142.34-15.806-2.618-31.02-3.864-41.386-4.454a12.668 12.668 0 0 0-13.394 12.65v21.598a12.806 12.806 0 0 1 3.396-0.276z" fill="#FFAC8C"></path>
							<path d="M865.658 118.83c-9.74 0-17.636-7.89-17.636-17.62 0-9.378-7.082-17.566-16.448-18.172-10.264-0.664-18.796 7.456-18.796 17.568v0.604c0 9.732-7.896 17.62-17.636 17.62-9.386 0-17.58 7.076-18.186 16.434-0.664 10.254 7.462 18.78 17.582 18.78h0.604c9.74 0 17.636 7.89 17.636 17.62 0 9.378 7.082 17.566 16.448 18.172 10.264 0.664 18.796-7.456 18.796-17.568v-0.604c0-9.732 7.896-17.62 17.636-17.62h0.604c10.12 0 18.248-8.524 17.584-18.78-0.608-9.358-8.804-16.434-18.188-16.434zM188.01 811.662c-13.588 0-24.602-11.006-24.602-24.582 0-13.082-9.88-24.504-22.946-25.35-14.318-0.926-26.22 10.402-26.22 24.508v0.842c0 13.576-11.014 24.582-24.602 24.582-13.092 0-24.524 9.872-25.37 22.926-0.928 14.306 10.41 26.198 24.528 26.198h0.844c13.588 0 24.602 11.006 24.602 24.582 0 13.082 9.88 24.504 22.946 25.35 14.318 0.926 26.22-10.402 26.22-24.508v-0.842c0-13.576 11.014-24.582 24.602-24.582h0.844c14.118 0 25.456-11.892 24.53-26.198-0.85-13.054-12.282-22.926-25.376-22.926z" fill="#69EBFC"></path>
						</svg>
						<div>{i18n.home.left.title.string}</div>
					</div>
					<div className="group">
						<div>{i18n.home.left.musiclist.string}</div>
						<div>
							{/* 每日推荐 */}
							<div onClick={() => history.push('/recommend')} className={this.activeClass('/recommend')}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fontSize: '1.5em' }}>
									<path d="M512 63C263.6 63 62.3 264 62.3 512S263.6 961 512 961s449.7-201 449.7-449S760.4 63 512 63zM314.8 326.7h82v-12.8c0-11 5.5-17.4 16.6-20 13.2-1.3 20.8 3.8 22.1 14.5v18.3h153v-17c0-11 5.9-17 18.3-18.3 12.3 1.3 18.7 7.2 20 18.3v16.6h80.3c11.1 1.3 17 7.2 18.3 18.3 0 12.3-5.5 18.3-16.6 18.3h-82v5.5c-1.3 13.6-7.2 20.8-18.3 22.1-13.6-1.3-20-8.5-20-22.1v-5.5H435.1v5.5c-1.3 11.1-8.1 17-20 18.3-12.3 1.3-18.3-3.8-18.3-14.5v-8.9h-80.3c-11.1 0-17-5.5-18.3-16.6 0.1-12.4 5.6-18.7 16.6-20z m82 385.9c-1.3 11.1-8.1 16.6-20 16.6-12.3 0-18.3-5.5-18.3-16.6V559.2c-12.3 9.8-26.3 18.3-42.1 25.5-11.1 6-18.7 4.3-23.8-5.5-5.9-10.2-4.3-19.1 5.5-26.4 54.8-29.3 103.3-67.1 146.2-113.5H319.9c-14.5 0-22.1-6-22.1-18.3s7.2-18.7 22.1-20h147.9c6-12.3 10.2-19.5 12.8-22.1 19.5-14.4 32.3-10.2 38.3 12.8-1.3 1.3-2.5 4.3-3.8 8.9h190c12.3 1.3 18.7 8.1 20 20-1.3 12.3-7.2 18.3-18.3 18.3H495.5c-36.5 40.4-69.3 71.8-98.6 94.8v178.9z m319.7-85h-82c3.8 39.1-4.7 67.6-25.5 85.9-34 22.1-79 25.1-135.1 8.9-12.3-6-17-15.3-14.5-27.2 3.8-9.8 12.3-14 25.5-12.8 45 14.5 77.3 15.3 96.9 1.7 14.5-7.2 19.6-26.3 14.5-56.5H444.5c-12.3 0-18.7-5.5-20-16.6 0-12.3 6-18.7 18.3-20h127.9c-2.5-1.3-6-3.8-11-7.2-19.5-15.7-28.5-27.2-27.2-34.9 0-7.2 18.3-20.8 54.8-40.4 3.8-2.5 7.2-4.7 11-7.2H488.2c-12.3 0-18.7-5.5-20-16.6 0-12.3 6-18.7 18.3-20h182.8c11 1.3 17.4 5.5 20 12.8 1.3 7.2-3 14-12.8 20-57.4 30.6-87.5 49.3-91.4 56.5 0 1.3 3 4.7 8.9 11 7.2 7.2 16.6 15.7 27.2 25.5h95.2c11 1.3 17 7.2 18.3 18.3-1.2 12.4-7.2 18.8-18.2 18.8z"></path>
								</svg>
								<div>{i18n.home.left.recommend.string}</div>
							</div>
							{/* 歌手 */}
							<div onClick={() => history.push('/artist')} className={this.activeClass('/artist')}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fontSize: '1.5em' }}>
									<path d="M920.1 363.3v297.1c0 53.9-28.7 103.7-75.4 130.6L587.4 939.5c-46.7 27-104.1 27-150.8 0L179.3 791c-46.7-27-75.4-76.7-75.4-130.6V363.3c0-53.9 28.7-103.7 75.4-130.6L436.6 84.2c46.6-27 104.1-27 150.8 0l257.3 148.5c12.2 7.1 23.1 15.6 32.5 25.4 13.6 13.8 24.2 30.1 31.6 47.9 7.3 17.8 11.3 37.3 11.3 57.3z" ></path>
									<path d="M908.8 306l-397 433.7c-12.3 9.3-29.7 6.9-38.9-5.4L236 421.7c25.1-19 54.6-28.2 83.8-28.2 42 0 83.6 18.9 110.9 55l79.4 104.9c3.7 4.9 10.3 6.8 16 4.6l351.1-300c13.6 13.9 24.2 30.2 31.6 48z" style={{ filter: 'invert(1)' }} ></path>
								</svg>
								<div>{i18n.home.left.artist.string}</div>
							</div>
							{/* 分类 */}
							<div onClick={() => history.push('/kind')} className={this.activeClass('/kind')}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fontSize: '1.5em' }}>
									<path d="M436.3 175.5C256.2 194.3 100.5 357 100.5 550c0 206.8 167.7 374.5 374.5 374.5 152.3 0 283.2-91.1 341.7-221.7L436.3 588.7V175.5zM487.9 98v446.8l411.9 123.6c16-39.8 27.2-87.7 27.2-142.4 0-236.4-220.7-428-439.1-428z"></path>
								</svg>
								<div>{i18n.home.left.kind.string}</div>
							</div>
							{/* 专辑 */}
							<div onClick={() => history.push('/album')} className={this.activeClass('/album')}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fontSize: '1.5em' }}>
									<path d="M0 1024h1024V0H0z" fillOpacity="0"></path>
									<path d="M512 99.555556c227.555556 0 412.444444 184.888889 412.444444 412.444444S739.555556 924.444444 512 924.444444 99.555556 739.555556 99.555556 512 284.444444 99.555556 512 99.555556z m0 71.111111c-189.155556 0-341.333333 152.177778-341.333333 341.333333s152.177778 341.333333 341.333333 341.333333 341.333333-152.177778 341.333333-341.333333-152.177778-341.333333-341.333333-341.333333zM241.777778 483.555556c15.644444 0 28.444444 12.8 28.444444 28.444444 0 27.022222 4.266667 52.622222 12.8 76.8 24.177778 72.533333 83.911111 130.844444 156.444445 153.6 22.755556 7.111111 46.933333 11.377778 72.533333 11.377778 15.644444 0 28.444444 12.8 28.444444 28.444444s-12.8 28.444444-28.444444 28.444445c-31.288889 0-61.155556-4.266667-89.6-14.222223-91.022222-28.444444-163.555556-99.555556-193.422222-189.155555-9.955556-29.866667-15.644444-62.577778-15.644445-95.288889 0-15.644444 12.8-28.444444 28.444445-28.444444z m270.222222-21.333334c27.022222 0 49.777778 22.755556 49.777778 49.777778s-22.755556 49.777778-49.777778 49.777778-49.777778-22.755556-49.777778-49.777778 22.755556-49.777778 49.777778-49.777778zM512 213.333333c31.288889 0 61.155556 4.266667 89.6 14.222223 91.022222 28.444444 163.555556 99.555556 193.422222 189.155555 9.955556 29.866667 15.644444 62.577778 15.644445 95.288889 0 15.644444-12.8 28.444444-28.444445 28.444444s-28.444444-12.8-28.444444-28.444444c0-27.022222-4.266667-52.622222-12.8-76.8-24.177778-72.533333-82.488889-130.844444-156.444445-153.6-22.755556-7.111111-48.355556-11.377778-72.533333-11.377778-15.644444 0-28.444444-12.8-28.444444-28.444444s12.8-28.444444 28.444444-28.444445z"></path>
								</svg>
								<div>{i18n.home.left.album.string}</div>
							</div>
						</div>
					</div>
					<div className="group flexed">
						<div>{i18n.home.left.mine.string}</div>
						<div>
							{/* 喜欢 */}
							<div onClick={() => {
								if (dataset.user) history.push('/love')
								else LoginDialog.open({})
							}} className={this.activeClass('/love')}>
								<svg viewBox="0 0 1127 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fontSize: '1.5em' }}>
									<path d="M959.165 127.999c-103.551-107.387-276.137-103.551-383.523-3.835-107.387-99.715-279.972-103.551-383.523 3.835-241.619 245.454 118.892 613.637 352.84 755.54 11.506 3.835 19.176 7.671 30.682 7.671 11.506 0 19.176-3.835 26.847-7.671 237.785-141.903 598.296-510.085 356.676-755.54zM729.050 197.033c0-19.176 15.34-26.847 30.682-30.682 80.54-7.671 145.738 61.363 157.244 130.398v0c3.835 19.176-7.671 30.682-23.012 34.517-11.506 0-26.847-7.671-30.682-23.012-19.176-49.858-49.858-84.375-107.387-84.375-15.34 0-26.847-15.34-26.847-26.847z"></path>
								</svg>
								<div>{i18n.home.left.love.string}</div>
							</div>
							{/* 歌单 */}
							{dataset.playlists.map(list => <div key={list.id} onClick={() => history.push(`/playlist/${list.id}`)} className={this.activeClass(`/playlist/${list.id}`)}>
								<svg viewBox="0 0 1116 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<path d="M269.824 770.56H20.992c-12.288 0-20.992 13.824-20.992 26.624 0 15.872 10.752 26.624 20.992 26.624H269.824c12.288 0 20.992-13.824 20.992-26.624 0-15.872-8.704-26.624-20.992-26.624zM23.552 469.504H541.184c14.336 0 23.552-13.824 23.552-26.624 0-15.872-12.288-26.624-23.552-26.624H23.552c-14.336 0-23.552 13.824-23.552 26.624 0 15.872 9.728 26.624 23.552 26.624zM17.408 174.592H648.704c10.752 0 17.408-13.824 17.408-26.624 0-15.872-9.216-26.624-17.408-26.624H17.408c-10.752 0-17.408 13.824-17.408 26.624 0 15.872 7.168 26.624 17.408 26.624z"></path>
									<path d="M942.08 112.64c-81.92-37.376-139.776 0-139.776 0v1.536c-6.656 5.12-11.264 12.288-11.264 20.48v446.976c-72.192-45.056-187.904-45.056-293.376 6.144-129.536 64-186.368 180.736-132.608 265.216 55.808 87.04 206.336 98.816 335.36 34.816 99.328-50.176 158.208-130.56 153.6-203.776v-465.92l1.024-1.024c37.376-56.32 180.736-27.136 261.12-56.32-42.496 11.776-76.8-10.24-174.08-48.128z"></path>
								</svg>
								<div>{list.name}</div>
							</div>)}
						</div>
					</div>
				</div>
				<div className="right">
					<div className="title">
						{/* 后退 */}
						<div className={`navigate ${history.isFirst ? 'disabled' : ''}`} onClick={() => history.back()}>
							<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
								<path d="M393.390114 512.023536l347.948667-336.348468c20.50808-19.85828 20.50808-51.997258 0-71.792093-20.507056-19.826558-53.778834-19.826558-74.28589 0L281.990954 476.135164c-20.476357 19.826558-20.476357 51.981908 0 71.746044l385.061936 372.236839c10.285251 9.91379 23.728424 14.869662 37.173644 14.869662 13.446243 0 26.889417-4.956895 37.112246-14.901385 20.50808-19.826558 20.50808-51.919487 0-71.746044L393.390114 512.023536"></path>
							</svg>
						</div>
						{/* 前进 */}
						<div className={`navigate ${history.isLast ? 'disabled' : ''}`} onClick={() => history.forward()}>
							<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
								<path d="M393.390114 512.023536l347.948667-336.348468c20.50808-19.85828 20.50808-51.997258 0-71.792093-20.507056-19.826558-53.778834-19.826558-74.28589 0L281.990954 476.135164c-20.476357 19.826558-20.476357 51.981908 0 71.746044l385.061936 372.236839c10.285251 9.91379 23.728424 14.869662 37.173644 14.869662 13.446243 0 26.889417-4.956895 37.112246-14.901385 20.50808-19.826558 20.50808-51.919487 0-71.746044L393.390114 512.023536"></path>
							</svg>
						</div>
						{/* 搜索 */}
						<div className="search">
							<form onSubmit={this.handleSearch.bind(this)}>
								<input type="text" placeholder={i18n.home.title.searchPlaceholder.string} name="keyword" autoComplete="off" />
								<button type="submit">
									<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
										<path d="M957.9 908.2L833.4 783.7c56.4-66.7 92.7-151.4 98.6-245.3 14.6-232-161.7-431.9-393.8-446.5-9-0.6-17.9-0.8-26.8-0.8-220.4 0-405.7 171.5-419.7 394.5-14.6 232 161.7 431.9 393.8 446.5 9 0.6 17.9 0.8 26.8 0.8 102.8 0 197.9-37.3 271.6-99.8l124.5 124.5c6.8 6.8 15.8 10.3 24.7 10.3 9 0 17.9-3.4 24.7-10.3 13.7-13.6 13.7-35.7 0.1-49.4z m-206.2-140C686.4 829.3 601.4 863 512.3 863c-7.4 0-14.9-0.2-22.4-0.7-47.3-3-92.6-15.1-134.6-36-40.6-20.3-76.5-47.9-106.6-82.1-30.2-34.2-53.1-73.3-68.1-116.1-15.5-44.3-21.9-90.7-18.9-138 5.6-89.7 44.8-172.8 110.4-234.2 65.3-61.1 150.3-94.8 239.5-94.8 7.4 0 14.9 0.2 22.3 0.7 47.3 3 92.6 15.1 134.6 36 40.6 20.3 76.5 47.9 106.6 82.1 30.2 34.2 53.1 73.3 68.1 116.1 15.5 44.3 21.9 90.7 18.9 138-5.7 89.6-44.9 172.8-110.4 234.2z"></path>
									</svg>
								</button>
							</form>
						</div>
						{/* 扩展 */}
						<div className="flexed"></div>
						{/* 用户 */}
						<div className="user">
							{dataset.user ? <Image className="avatar" src={dataset.user.avatar} type="api" string={dataset.user.name} /> : <div className="avatar"></div>}
							<div className="name">
								{dataset.user ? null : <div className="link" onClick={() => LoginDialog.open({})}>请登录</div>}
								{dataset.user ? <div>{dataset.user.name}</div> : null}
							</div>
						</div>
						{/* 操作栏 */}
						<AppbarButtons
							btns={['maximize', 'minimize', 'close', 'menu']}
							onBtnClick={(btn, e) => {
								if (btn == 'menu') this.handleOpenMenu(e)
								else if (btn == 'close') nativeApi.window.show(false)
								else if (btn == 'minimize') nativeApi.window.minimize()
								else if (btn == 'maximize') nativeApi.window.maximize(true)
								else if (btn == 'restore') nativeApi.window.maximize(false)
							}}
							currentSize={(nativeApi.window.getState()?.maximized) ? 'maximize' : 'normal'}
						/>
					</div>
					<div className="content">
						<Switch location={history.location}>
							<Route exact path="/recommend" component={RecommendPage} />
							<Route exact path="/artist" component={ArtistPage} />
							<Route exact path="/artist/:id" component={ArtistDetailPage} />
							<Route exact path="/kind" component={KindPage} />
							<Route exact path="/kind/:id" component={KindDetailPage} />
							<Route exact path="/album" component={AlbumPage} />
							<Route exact path="/album/:id" component={AlbumDetailPage} />
							<Route exact path="/love" component={LovePage} />
							<Route exact path="/manage" component={ManagePage} />
							<Route exact path="/playlist/:id" component={PlaylistPage} />
							<Route exact path="/setting" component={SettingPage} />
							<Route path="/" component={() => <div>NULL</div>} />
						</Switch>
					</div>
					<Player />
				</div>
			</div>
		)
	}

}