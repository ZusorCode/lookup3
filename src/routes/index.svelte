<script context='module'>
	export const prerender = true;
	export const router = false;
</script>

<script>
	import axios from 'axios';
	import twemoji from 'twemoji';
	import SvelteTable from 'svelte-table';
	import ZusorLogo from '$lib/ZusorLogo/index.svelte';

	let battletagCheck = /^[^\s#]{2,11}#[0-9]{4,8}$/ugm;

	let currentlyRunning = 0;
	let bnetInput = '';
	let players = [];
	let lockedBnets = [];

	$: currentBnets = players.map(player => [player.fixedBnet, player.bnet]).flat().filter(x => x);


	async function loadPlayers(bnets) {
		let fixedBnetInput = bnets;
		let newlineAlternatives = [',', ';', ':', ' ', '\t', '/', '"', '\'', '$', '-', '!', '\\\\'];
		for (const alternative of newlineAlternatives) {
			fixedBnetInput = fixedBnetInput.replace(new RegExp(alternative, 'g'), '\n');
		}
		let userInputs = fixedBnetInput.split(/\r?\n/).filter(x => x);

		let queuedBnets = userInputs
			// Remove empty values
			.filter(bnet => !!bnet)
			// Only check for valid battletags
			.filter(userInput => userInput.match(battletagCheck) !== null)
			// Make sure the battletag is not already in the list
			.filter(bnet => !currentBnets.includes(bnet))
			// Make sure the battletag is not already being loaded
			.filter(bnet => !lockedBnets.includes(bnet));

		// Remove duplicates
		queuedBnets = [...new Set(queuedBnets)];

		// lock the battletags from processing them again
		lockedBnets = lockedBnets.concat(queuedBnets);

		const lookups = queuedBnets.map(async bnet => {
			try {
				const player = (await axios.post('/load-player', { bnet: bnet })).data;
				players.push(player);
				lockedBnets = lockedBnets.filter(x => x !== bnet);
				players = players;
			} catch (e) {
				console.log(e);
			}
			currentlyRunning -= 1;
		});
		currentlyRunning += lookups.length;
		await Promise.all(lookups);
	}

	async function addPlayersFromTextArea() {
		await loadPlayers(bnetInput);
	}

	async function addPlayersFromPaste(data) {
		await loadPlayers(data);
	}

	function clearPlayers() {
		players = [];
	}

	const columns = [
		{
			key: 'battletag',
			title: 'Battletag',
			value: player => player?.fixedBnet || player?.bnet,
			renderValue: player => {
				if (player.success) {
					if (player.wasFixed) {
						return `<span class='inline-flex gap-2 items-center'><span class='line-through'>${player.bnet}</span></span></span> ${player.fixedBnet}`;
					} else {
						return player.bnet;
					}
				} else {
					return `<span class='inline-flex gap-2 items-center'>${twemoji.parse('❌')} <span class='line-through'>${player.bnet}</span></span`;
				}
			},
			headerClass: 'text-left',
			sortable: true
		},
		{
			key: 'level',
			title: 'Level',
			value: player => player.playerData?.prestige * 100 + player.playerData?.level || 0,
			renderValue: player => player.playerData?.prestige * 100 + player.playerData?.level || '',
			headerClass: 'text-left',
			sortable: true
		},
		{
			key: 'private',
			title: 'Private',
			value: player => player.playerData?.private || true,
			renderValue: player => player.success ? player.playerData?.private ? twemoji.parse('🔒') : twemoji.parse('🔓') : '',
			class: 'flex justify-center',
			sortable: true
		},
		{
			key: 'winrate',
			title: 'Winrate',
			value: player => {
				return Math.round((player.playerData?.competitiveStats?.games?.won / player.playerData?.competitiveStats?.games?.played) * 100) || 0;
			},
			renderValue: player => {
				return player.success ? `${Math.round((player.playerData?.competitiveStats?.games?.won / player.playerData?.competitiveStats?.games?.played) * 100) || 0}%` : '';
			},
			class: 'text-center tabular-nums',
			sortable: true
		},
		{
			key: 'games_played',
			title: 'Games Played',
			value: player => {
				return player.playerData?.competitiveStats?.games?.played || 0;
			},
			renderValue: player => {
				return player.success ? player.playerData?.competitiveStats?.games?.played || '' : '';
			},
			class: 'text-center tabular-nums',
			sortable: true
		},
		{
			key: 'tank',
			title: 'Tank',
			value: player => {
				return player.playerData?.ratings?.tank?.level || 0;
			},
			renderValue: player => {
				return player.success ? player.playerData?.ratings?.tank?.level || '' : '';
			},
			class: 'text-center tabular-nums',
			sortable: true
		},
		{
			key: 'damage',
			title: 'Damage',
			value: player => {
				return player.playerData?.ratings?.damage?.level || 0;
			},
			renderValue: player => {
				return player.success ? player.playerData?.ratings?.damage?.level || '' : '';
			},
			class: 'text-center tabular-nums',
			sortable: true
		},
		{
			key: 'support',
			title: 'Support',
			value: player => {
				return player.playerData?.ratings?.support?.level || 0;
			},
			renderValue: player => {
				return player.success ? player.playerData?.ratings?.support?.level || '' : '';
			},
			class: 'text-center tabular-nums',
			sortable: true
		}
	];


</script>

<svelte:head>
	<title>Overwatch Bulk Lookup</title>
	<meta content='Overwatch Bulk Lookup' property='og:title'>
	<meta content='Overwatch Bulk Lookup' property='twitter:title'>
	<meta
		content='Look up hundreds of Overwatch profiles instantly to see their level, SR, winrate all organized in a neat table'
		name='description'>
	<meta
		content='Look up hundreds of Overwatch profiles instantly to see their level, SR, winrate all organized in a neat table'
		property='og:description'>
	<meta
		content='Look up hundreds of Overwatch profiles instantly to see their level, SR, winrate all organized in a neat table'
		property='twitter:description'>
	<meta content='website' property='og:type'>
	<meta content='summary' property='twitter:card'>
	<meta content='@ZusorOW' property='twitter:site'>
	<meta content='@ZusorOW' property='twitter:creator'>
	<link href='https://fonts.googleapis.com' rel='preconnect'>
	<link crossorigin href='https://fonts.gstatic.com' rel='preconnect'>
	<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap' rel='stylesheet'>
</svelte:head>

<div class='container mx-auto p-4 flex flex-col gap-4 text-white'>
	<h1 class='text-6xl font-bold'>Overwatch Bulk Lookup</h1>
	<textarea bind:value={bnetInput} class='rounded-lg bg-gray-800 text h-36'
						on:keyup={e=>e.key==='Enter' && addPlayersFromTextArea()}
						on:paste={val => addPlayersFromPaste(val.clipboardData.getData('text'))}
						placeholder='Battletags#1234 seperated by commas, spaces, tabs, new lines, semicolons...'></textarea>
	<div class='grid grid-cols-1 sm:grid-cols-2 gap-2'>

		<button class='p-2 bg-lime-600 rounded-lg text-white text-xl font-bold  hover:bg-lime-700 transition-colors'
						class:animate-pulse={currentlyRunning !== 0} class:cursor-wait={currentlyRunning !== 0}
						on:click={addPlayersFromTextArea}>
			{#if currentlyRunning !== 0}
				Loading {currentlyRunning} players...
			{:else }
				Load
			{/if}
		</button>
		<button class='p-2 bg-red-500 rounded-lg text-white text-xl font-bold hover:bg-red-600 transition-colors'
						on:click={clearPlayers}>
			Clear
		</button>
	</div>

	<SvelteTable {columns} rows={players} />

	<ZusorLogo />
</div>

<style>
    :global(img.emoji) {
        height: 1em;
        width: 1em;
        margin: 0 .05em 0 .1em;
        vertical-align: -0.1em;
    }

    :global(body) {
        @apply bg-gray-900;
    }

    :global(::-webkit-scrollbar) {
        width: 10px;
        height: 10px;
    }

    :global(::-webkit-scrollbar-track) {
        @apply bg-gray-800 rounded-lg;
    }

    :global(::-webkit-scrollbar-thumb) {
        @apply bg-gray-600 rounded-lg;
    }

    :global(::-webkit-resizer) {
        @apply rounded-br-lg border-transparent border-b-gray-600 border-r-gray-600 border-8 border-solid;
    }

</style>
