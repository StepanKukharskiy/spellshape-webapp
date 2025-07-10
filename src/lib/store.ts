import { writable } from 'svelte/store';

export let width = writable(0);
export let height = writable(0);
export let bgColor = writable('0, 0%, 98%');
export let textColor = writable('0, 0%, 10%');