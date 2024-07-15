import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import { PlusCircle } from 'lucide-react-native'
type AddCarProps = {}
export function AddCar(props: AddCarProps) {
  const t = useTheme()
  return (
    <TouchableOpacity style={[a.justify_center, a.align_center]}>
      <PlusCircle size={15} color={'#000'} />
      <Text style={[a.text_2xs]}>Add Car</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({})
