<script setup>
  import Deletedocument from './components/requests/Deletedocument.vue'
  import Insertdocument from './components/requests/Insertdocument.vue'
  import Finddocument from './components/requests/Finddocument.vue'
  import Updatedocument from './components/requests/Updatedocument.vue'
  import Deletecollection from './components/requests/Deletecollection.vue'
  import Admin from './components/requests/Admin.vue'
  import Createcollection from './components/requests/Createcollection.vue'

</script>

<template>
  <TabView>
	  <TabPanel header="create collection">
      <Createcollection/>
	  </TabPanel>

	  <TabPanel header="delete collection">
      <Deletecollection/>
	  </TabPanel>

	  <TabPanel header="delete document">
      <Deletedocument />
	  </TabPanel>
	  <TabPanel header="insert document">
      <Insertdocument />
	  </TabPanel>
	  <TabPanel header="find document">
      <Finddocument/>
	  </TabPanel>
	  <TabPanel header="update document">
      <Updatedocument/>
	  </TabPanel>
	  <TabPanel header="admin">
      <Admin/>
	  </TabPanel>
  </TabView>

</template>

<style scoped>
</style>
