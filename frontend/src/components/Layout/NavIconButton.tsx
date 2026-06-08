'use client';

import { usePathname, useRouter } from 'next/navigation';
import { IconButton, Tooltip, Box, Badge } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

export interface NavIconButtonProps {
	icon: SvgIconComponent;
	label: string;
	tooltipPlacement: "bottom" | "top" | "left" | "right",
	href?: string;
	badgeCount?: number;
	onClick?: () => void;
	disableActive?: boolean;
	active?: boolean;
}

export default function NavIconButton({
	icon: Icon,
	label,
	tooltipPlacement = "bottom",
	href,
	badgeCount,
	onClick,
	disableActive = true,
}: NavIconButtonProps) {
	const router = useRouter();
	const pathname = usePathname();

	const handleClick = () => {
		if (onClick) {
			onClick();
		} else if (href) {
			router.push(href);
		}
	};
	
	const isActive = (pathname === href);

	const button = (
		<IconButton 
		onClick={handleClick}
		sx={{
			color: isActive ? 'tertiary.onTertiaryContainer' : 'text.secondary',
			backgroundColor: isActive ? 'tertiary.tertiaryContainer' : 'transparent',
			borderRadius: 2,
			width: 36,
			height: 36,
			transition: 'all 0.2s ease-in-out',
			'&:hover': {
				backgroundColor: 'action.hover',
				color: 'tertiary.main',
			},
		}}
		>
			<Icon />
		</IconButton>
	);

	if (badgeCount) {
		return (
			<Tooltip title={label} placement={tooltipPlacement}>
			<Badge badgeContent={badgeCount} color="tertiary">
					{button}
				</Badge>
			</Tooltip>
		)
	}

	return (
		<Tooltip title={label} placement={tooltipPlacement}>
			{button}
		</Tooltip>
	
	);
}
