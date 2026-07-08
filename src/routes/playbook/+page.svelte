<script lang="ts">
  import PlaybookList from '$lib/PlaybookList.svelte';
  import Whiteboard from '$lib/Whiteboard.svelte';
</script>

<div class="page">
  <PlaybookList parentId={null} title="Playbook" />

  <hr class="sep" />

  <Whiteboard />
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .sep {
    width: 100%;
    height: 0;
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
</style>
