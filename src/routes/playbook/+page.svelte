<script lang="ts">
  import PlaybookList from '$lib/PlaybookList.svelte';
</script>

<div class="page">
  <PlaybookList parentId={null} title="Playbook" />
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 2rem;
  }
</style>
