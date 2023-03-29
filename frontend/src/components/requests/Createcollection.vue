<script setup> 
  import axios from 'axios';
  import { ref, reactive } from 'vue';
  const newResponseStatus = ref('');
  const newResponse = ref({});
  const newRequest = reactive({
    collectionname: '',
    requirepasswordtodelete: '',
    email: '',
    password: '',
    websiterestrictions: '',
    iprestrictions: '',
    schema: '',
  });

  function submitRequest() {
    if (newRequest.websiterestrictions == '') {
      delete newRequest.websiterestrictions;
    }
    if (newRequest.iprestrictions == '') {
      delete newRequest.iprestrictions;
    }
    if (newRequest.schema == '' ) {
      delete newRequest.schema;
    }

    axios({
      method: 'post',
      // url: 'http://34.27.198.255:5000/createcollection',
      url: 'https://34.27.198.255/createcollection',
      data: {
        collectionname: newRequest.collectionname,
        requirepasswordtodelete: newRequest.requirepasswordtodelete,
        email: newRequest.email,
        password: newRequest.password,
        websiterestrictions: newRequest.websiterestrictions,
        iprestrictions: newRequest.iprestrictions,
        schema: newRequest.schema,
      }
    }).then(function (response) {
        newResponseStatus.value = 'response1';
        newResponse.value = JSON.stringify(response.data, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    }).catch( function (error) {
        console.log(error);
        newResponseStatus.value = 'response2';
        newResponse.value = JSON.stringify(error.request?.response, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    });
  }
  function loadExample() {
    newRequest.collectionname = 'mynewcollection';
    newRequest.requirepasswordtodelete = true;
    newRequest.email = 'test@example.com';
    newRequest.password = 'Password1234';
    newRequest.websiterestrictions = "";
    newRequest.iprestrictions = "";
    newRequest.schema = `{
        "type": "object",
        "properties": {
            "foo": { 
              "type": "array", 
              "items": { "type": "string" }, 
              "maxItems": 3 
            },
            "bar": { "type": "string", "maxLength": 3, "minLength": 1 },
            "fooo": { "type": "number", "minimum": 1, "maximum": 10 },
            "bax": { "type": "boolean" },
            "baz": { 
              "type": "object", 
              "minProperties": 1, 
              "maxProperties": 3, 
              "required": ["foo", "bar"] 
            }
        },
        "required": ["foo", "bar", "fooo"],
        "additionalProperties": false
    }`;
  }
</script>
<template>
    <div class="container">
      <span class="label1">collectionname: </span>
      <span class="label2">requirepasswordtodelete: </span>
      <span class="label3">email: </span>
      <span class="label4">password: </span>
      <span class="label5">websiterestrictions: </span>
      <span class="label6">iprestrictions: </span>
      <span class="label7">schema: </span>
      <InputText id="txt" type="text" v-model="newRequest.collectionname" class="p-inputtext-sm input1" placeholder="any name to identify collection" />
      <InputText id="txt" type="text" v-model="newRequest.requirepasswordtodelete" class="p-inputtext-sm input2" placeholder="true/false to delete the collection or entry"/>
      <InputText id="txt" type="text" v-model="newRequest.email" class="p-inputtext-sm input3" placeholder="to send notifications"/>
      <InputText id="txt" type="text" v-model="newRequest.password" class="p-inputtext-sm input4" placeholder="to protect from deletition"/>
      <InputText id="txt" type="text" v-model="newRequest.websiterestrictions" class="p-inputtext-sm input5" placeholder="only certain domains can insert in the collection"/>
      <InputText id="txt" type="text" v-model="newRequest.iprestrictions" class="p-inputtext-sm input6" placeholder="only certain ips can insert in the collection"/>
      <Textarea v-model="newRequest.schema" :autoResize="false" rows="1" cols="30" class="input7" placeholder="insert only if pases the given schema"/>
      <div class="button1">
        <Button label="Submit" @click="submitRequest" />
        <Button label="Load example" class="button2" @click="loadExample"/>
      </div>
    </div>
    <h3>http raw request</h3>
    <template v-if="newRequest.collectionname">
      <div>POST http://microdb.fredy.dev/{{ newRequest.collectionname }} HTTP/1.1<br>
        Content-Type: application/json<br>
       <br> 
        {<br>
          "email": {{newRequest.email}},<br>
          "password": {{newRequest.password}},<br>
          "requirepasswordtodelete": {{newRequest.requirepasswordtodelete}},<br>
          <span v-if="newRequest.websiterestrictions">"websiterestrictions":{{newRequest.websiterestrictions}},<br></span>
          <span v-if="newRequest.iprestrictions">"iprestrictions":{{newRequest.iprestrictions}},<br></span>
          "schema":<pre>{{newRequest.schema}}</pre>
        }
      </div>
    </template>
    <h3>response:</h3>
    <template v-if="Object.keys(newResponse).length !== 0">
      <pre :class="newResponseStatus">{{ newResponse }}</pre>
    </template>

</template>
<style>
.container {
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 140px 1fr; 
  gap: 10px 0px; 
  grid-template-areas: 
    "label1 input1"
    "label2 input2"
    "label3 input3"
    "label4 input4"
    "label5 input5"
    "label6 input6"
    "label7 input7"
    "button1 .";
}
.container > [class^='label'] {
  margin-bottom: auto;
  font-weight: 700;
}
.label1 { grid-area: label1; }
.label2 { grid-area: label2; }
.label3 { grid-area: label3; }
.label4 { grid-area: label4; }
.label5 { grid-area: label5; }
.label6 { grid-area: label6; }
.label7 { grid-area: label7; }
.input1 { grid-area: input1; }
.input2 { grid-area: input2; }
.input3 { grid-area: input3; }
.input4 { grid-area: input4; }
.input5 { grid-area: input5; }
.input6 { grid-area: input6; }
.input7 { grid-area: input7; }
.button1 { grid-area: button1; display: inline;}
/* button {
  margin-left: 10px;
} */
.button1 > button:nth-of-type(2) {
    margin-left: 10px;
}
.response1 {
  background-color: rgba(0, 128, 0, 0.123);
  padding: 10px;
}
.response2 {
  background-color: rgba(128, 0, 0, 0.123);
  padding: 10px;
  word-wrap: break-word;
}
pre {
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
</style>