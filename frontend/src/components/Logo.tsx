import LogoSVG from '@/assets/logo.svg';
import { SvgIcon } from '@mui/material'

export default function Logo(props) {
	return <SvgIcon component={LogoSVG} viewBox='0 0 256 256' {...props} />
}; 
