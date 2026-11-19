<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import { PostApi, type Post, type PostSaveParam } from '#/api/system/post.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemPost' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<Post[]>([]);
  const query = reactive({ name: '', code: '', status: undefined as number | undefined });

  const canCreate = computed(() => hasAccessByCodes(['system:post:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:post:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:post:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<PostSaveParam>({ status: 0, sort: 0 });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  // 列标题用 computed：语言切换后表格头立即跟随
  const columns = computed(() => [
    { key: 'code', title: $t('system.post.col.code'), dataIndex: 'code', width: 180 },
    { key: 'name', title: $t('system.post.col.name'), dataIndex: 'name' },
    { key: 'sort', title: $t('system.post.col.sort'), dataIndex: 'sort', width: 80 },
    { key: 'status', title: $t('system.post.col.status'), width: 90 },
    { key: 'remark', title: $t('system.post.col.remark') },
    { key: 'action', title: $t('system.post.col.action'), width: 140, fixed: 'right' },
  ]);

  /** 状态字典（含文案，切换语言后下拉立即跟随） */
  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  async function load() {
    loading.value = true;
    try {
      const { data } = await PostApi.list({
        code: query.code || undefined,
        name: query.name || undefined,
        status: query.status,
      });
      list.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.code = '';
    query.status = undefined;
    load();
  }

  function openCreate() {
    editing.value = false;
    Object.assign(form, { id: undefined, code: '', name: '', sort: 0, status: 0, remark: '' });
    modalOpen.value = true;
  }

  function openEdit(row: Post) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      code: row.code,
      name: row.name,
      sort: row.sort ?? 0,
      status: row.status ?? 0,
      remark: row.remark ?? '',
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name || !form.code) {
      message.warning($t('system.post.msg.required'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await PostApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await PostApi.create({ ...form });
        message.success($t('common.msg.created'));
      }
      modalOpen.value = false;
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || $t('common.msg.saveFailed'));
    } finally {
      submitting.value = false;
    }
  }

  function remove(row: Post) {
    Modal.confirm({
      content: $t('system.post.msg.deleteConfirm', { name: row.name }),
      onOk: async () => {
        await PostApi.delete(row.id);
        message.success($t('common.msg.deleted'));
        await load();
      },
      title: $t('common.msg.deleteConfirmTitle'),
    });
  }

  onMounted(load);
</script>

<template>
  <div class="page">
    <a-card variant="borderless">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item :label="$t('system.post.col.name')">
          <a-input v-model:value="query.name" allow-clear :placeholder="$t('common.placeholder.fuzzy')" />
        </a-form-item>
        <a-form-item :label="$t('system.post.col.code')">
          <a-input v-model:value="query.code" allow-clear />
        </a-form-item>
        <a-form-item :label="$t('system.post.col.status')">
          <a-select
            v-model:value="query.status"
            allow-clear
            :placeholder="$t('common.placeholder.all')"
            style="width: 110px"
            :options="statusOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load">{{ $t('common.action.query') }}</a-button>
            <a-button @click="resetQuery">{{ $t('common.action.reset') }}</a-button>
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">{{ $t('system.post.create') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'remark'">{{ record.remark || '—' }}</template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.post.edit') : $t('system.post.create')"
      destroy-on-hidden
      width="520px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="$t('system.post.form.code')" required>
          <a-input v-model:value="form.code" :disabled="editing" />
        </a-form-item>
        <a-form-item :label="$t('system.post.form.name')" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="$t('system.post.form.sort')">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('system.post.form.status')">
          <a-select v-model:value="form.status" :options="statusOptions" />
        </a-form-item>
        <a-form-item :label="$t('system.post.form.remark')">
          <a-textarea v-model:value="form.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
  .page {
    padding: 16px;
  }

  .query {
    margin-bottom: 12px;
  }

  .danger {
    color: hsl(var(--destructive));
  }
</style>
