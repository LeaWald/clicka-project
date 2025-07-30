import { Meta, StoryObj } from '@storybook/react-webpack5';
import { FileInputField } from './FileInputFile';
import { useForm, FormProvider } from 'react-hook-form';

const meta: Meta<typeof FileInputField> = {
  title: 'BaseComponents/FileInputFile',
  component: FileInputField,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'example',
    label: 'Test File Input',
    required: true,
    multiple: true,
  },
  render: (args) => {
    const methods = useForm();
    return (
      <FormProvider {...methods}> {/* עוטף את הקומפוננטה ב־FormProvider */}
        {/* <FileInputField {...args} /> */}
      </FormProvider>
    );
  },
};
