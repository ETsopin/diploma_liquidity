'use client'

import {
	Stack,
	Container,
	Tooltip,
	IconButton,
} from '@mui/material';

import ListIcon from '@mui/icons-material/List';

export default function LeftSidebar() {
	return (
		<Stack
			direction="column"
			sx={{
				width: 72,
			}}
		>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>

		</Stack>
	);

}
