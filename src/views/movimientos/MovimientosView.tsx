import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Radio, Space, message } from 'antd';
import { movimientosService, cuentasService, transferenciasService, categoriasService } from '../../services/api/FinanzasService';

export default function MovimientosView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  
  const [form] = Form.useForm();
  const [cuentaForm] = Form.useForm();
  const transactionType = Form.useWatch('tipo', form);

  // 1. CARGA DE DATOS CORREGIDA
  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, cueRes, catRes] = await Promise.all([
        movimientosService.findAll(),
        cuentasService.findAll(),
        categoriasService.findAll()
      ]);

      // 🔥 CORRECCIÓN: Extraer el arreglo explícitamente (buscando 'content' o 'data')
      const movArray = movRes?.content || movRes?.data || (Array.isArray(movRes) ? movRes : []);
      const cueArray = cueRes?.content || cueRes?.data || (Array.isArray(cueRes) ? cueRes : []);
      const catArray = catRes?.content || catRes?.data || (Array.isArray(catRes) ? catRes : []);

      setData(movArray);
      setCuentas(cueArray);
      setCategorias(catArray);
    } catch (error) {
      console.error(error);
      message.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleSaveTransaction = async () => {
    try {
      const values = await form.validateFields();
      if (values.tipo === 'TRANSFERENCIA') {
        await transferenciasService.create({
          payload: {
            monto: values.monto,
            cuentaOrigenId: values.cuenta_origen_id,
            cuentaDestinoId: values.cuenta_destino_id,
            categoriaId: values.categoria_id
          }
        });
      } else {
        await movimientosService.create({
          payload: {
            tipo: values.tipo,
            monto: Number(values.monto),
            descripcion: values.descripcion,
            cuenta_id: values.cuenta_id,
            categoria_id: values.categoria_id,
          }
        });
      }
      message.success('Operación exitosa');
      setIsTxModalOpen(false);
      form.resetFields();
      fetchData(); // Recargar la tabla con los nuevos datos
    } catch (error) { 
      message.error('Error al procesar la operación'); 
    }
  };

  const handleSaveCuenta = async () => {
    try {
      const values = await cuentaForm.validateFields();
      await cuentasService.create({
        payload: {
          nombre: values.nombre,
          banco: values.banco,
          saldoBase: Number(values.saldo_inicial) 
        }
      });
      message.success('Cuenta creada exitosamente');
      setIsCuentaModalOpen(false);
      cuentaForm.resetFields();
      fetchData(); // Recargar cuentas
    } catch (error) { 
      message.error('Error al crear cuenta'); 
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>Gestión de Movimientos</h2>
        <Space>
          <Button onClick={() => setIsCuentaModalOpen(true)}>Nueva Cuenta</Button>
          <Button type="primary" onClick={() => setIsTxModalOpen(true)}>Nueva Operación</Button>
        </Space>
      </div>

      <Table loading={loading} dataSource={data} rowKey="id" columns={[
        { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
        { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
        { title: 'Monto', dataIndex: 'monto', key: 'monto' }
      ]} />

      <Modal open={isTxModalOpen} onOk={handleSaveTransaction} onCancel={() => setIsTxModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ tipo: 'INGRESO' }}>
          <Form.Item name="tipo" label="Tipo">
            <Radio.Group>
              <Radio value="INGRESO">Ingreso</Radio>
              <Radio value="EGRESO">Egreso</Radio>
              <Radio value="TRANSFERENCIA">Transferencia</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="monto" label="Monto" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          {transactionType !== 'TRANSFERENCIA' && (
             <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
               <Input />
             </Form.Item>
          )}
          {transactionType === 'TRANSFERENCIA' ? (
            <>
              <Form.Item name="cuenta_origen_id" label="Origen" rules={[{ required: true }]}>
                <Select>{cuentas.map(c => <Select.Option key={c.id} value={c.id}>{c.nombre}</Select.Option>)}</Select>
              </Form.Item>
              <Form.Item name="cuenta_destino_id" label="Destino" rules={[{ required: true }]}>
                <Select>{cuentas.map(c => <Select.Option key={c.id} value={c.id}>{c.nombre}</Select.Option>)}</Select>
              </Form.Item>
            </>
          ) : (
            <Form.Item name="cuenta_id" label="Cuenta" rules={[{ required: true }]}>
              <Select>{cuentas.map(c => <Select.Option key={c.id} value={c.id}>{c.nombre}</Select.Option>)}</Select>
            </Form.Item>
          )}
          <Form.Item name="categoria_id" label="Categoría" rules={[{ required: true }]}>
            <Select>{categorias.map(cat => <Select.Option key={cat.id} value={cat.id}>{cat.nombre}</Select.Option>)}</Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={isCuentaModalOpen} onOk={handleSaveCuenta} onCancel={() => setIsCuentaModalOpen(false)} destroyOnClose>
        <Form form={cuentaForm} layout="vertical">
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="banco" label="Banco" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="saldo_inicial" label="Saldo Inicial" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  ); 
}