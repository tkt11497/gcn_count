<template>
  <div
    class="card p-4 mb-5"
    :class="`has-background-${ bgColor }-dark`"
  >
    <label
      v-if="label"
      class="label has-text-white"
    >
      {{ label }}
    </label>

    <div class="field">
      <div class="control">
        <input class="input my-input" ref="iosLinkRef" type="text" placeholder="IOS Link1" v-model="iosLink"  v-autofocus>
        <input class="input my-input" ref="androidLinkRef" type="text" placeholder="Android Link1" v-model="androidLink">
        <input class="input my-input" ref="iosLinkRef2" type="text" placeholder="IOS Link2" v-model="iosLink2">
        <input class="input my-input" ref="androidLinkRef2" type="text" placeholder="Android Link2" v-model="androidLink2">
        <input class="input my-input" ref="cs_service" type="text" placeholder="customer service" v-model="cs_link">
        <!-- <textarea
          v-model="content"
          class="textarea"
          :placeholder="placeholder"
          ref="textareaRef"
          maxlength="200"
          v-autofocus
        /> -->
      </div>
    </div>

    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <slot name="buttons" />
      </div>
    </div>
  </div>
</template>

<script setup>

/*
@input="$emit('update:modelValue', modelValue)"
  imports
*/

  import { ref } from 'vue'
  import { vAutofocus } from '@/directives/vAutofocus'

/*
  props
*/
  // const content = defineModel('content', { required: true })
  const iosLink = defineModel('iosLink', { required: true })
  const androidLink = defineModel('androidLink', { required: true })
  const iosLink2 = defineModel('iosLink2', { required: true })
  const androidLink2 = defineModel('androidLink2', { required: true })
  const cs_link = defineModel('cs_link', { required: true })
  const props = defineProps({
    // modelValue: {
    //   type: String,
    //   required: true
    // },
    bgColor: {
      type: String,
      default: 'success'
    },
    placeholder: {
      type: String,
      default: 'Type something...'
    },
    label: {
      type: String
    }
  })

/*
  emits
*/

  const emit = defineEmits(['update:modelValue'])

/*
  focus textarea
*/

  const textareaRef = ref(null)

  const focusTextarea = () => {
    textareaRef.value.focus()
  }

  defineExpose({
    focusTextarea
  })

</script>
<style scoped>
.my-input {
  margin-bottom: 1rem;
}
</style>
